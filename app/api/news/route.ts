import { NextResponse } from 'next/server';

// Finnhub Configuration
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

// Cache Configuration
let GENERAL_NEWS_CACHE: { data: any; timestamp: number } | null = null;
let PORTFOLIO_NEWS_CACHE: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Sentinel Keywords (Critical alerts)
const CRITICAL_KEYWORDS = [
    'resigns', 'resignation', 'investigation', 'sold', 'dump', 'dumps', 'crash', 'lawsuit', 'fraud',
    'avgår', 'säljer', 'utreds', 'konkurs', 'stämning', 'bedrägeri', 'skandal'
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tickersParam = searchParams.get('tickers'); // e.g., "AAPL,TSLA,INVE-B.ST"
    const now = Date.now();

    if (!FINNHUB_API_KEY) {
        return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    // --- MODE 1: Personalized News (tickers provided) ---
    if (tickersParam) {
        const tickers = tickersParam.split(',').slice(0, 5); // Limit to 5 to avoid rate limits
        const cacheKey = tickers.sort().join(',');

        // Check cache
        const cached = PORTFOLIO_NEWS_CACHE.get(cacheKey);
        if (cached && (now - cached.timestamp < CACHE_DURATION)) {
            console.log(`[News API] Serving Portfolio News from CACHE ⚡️`);
            return NextResponse.json(cached.data);
        }

        console.log(`[News API] Fetching company news for: ${tickers.join(', ')}`);

        try {
            // Fetch news for each ticker in parallel
            const newsPromises = tickers.map(async (ticker) => {
                // Skip Swedish stocks (Finnhub doesn't have news for them)
                if (ticker.includes('.ST') || ticker.includes('.HE')) {
                    return [];
                }

                const res = await fetch(
                    `${FINNHUB_URL}/company-news?symbol=${ticker}&from=${getDateString(-30)}&to=${getDateString(0)}&token=${FINNHUB_API_KEY}`
                );
                if (!res.ok) return [];
                const data = await res.json();
                return Array.isArray(data) ? data.slice(0, 5).map((item: any) => ({
                    ...normalizeNewsItem(item),
                    ticker: ticker // Tag with ticker for filtering
                })) : [];
            });

            const results = await Promise.all(newsPromises);
            let allNews = results.flat();

            // Deduplicate by ID
            const uniqueNews = Array.from(new Map(allNews.map(item => [item.id, item])).values());

            // Sort by datetime (newest first)
            uniqueNews.sort((a: any, b: any) => b.datetime - a.datetime);

            // Apply Sentinel Analysis
            const analyzedNews = applySentinelAnalysis(uniqueNews, tickers);

            // Limit to 20 items
            const finalNews = analyzedNews.slice(0, 20);

            // Update Cache
            PORTFOLIO_NEWS_CACHE.set(cacheKey, { data: finalNews, timestamp: now });

            return NextResponse.json(finalNews);

        } catch (error: any) {
            console.error('[News API] Portfolio News Error:', error.message);
            return NextResponse.json([]);
        }
    }

    // --- MODE 2: General Market News (default) ---
    if (GENERAL_NEWS_CACHE && (now - GENERAL_NEWS_CACHE.timestamp < CACHE_DURATION)) {
        console.log('[News API] Serving General News from CACHE ⚡️');
        return NextResponse.json(GENERAL_NEWS_CACHE.data);
    }

    try {
        console.log(`[News API] Fetching general news from Finnhub...`);
        const res = await fetch(`${FINNHUB_URL}/news?category=general&token=${FINNHUB_API_KEY}`);

        if (!res.ok) throw new Error(`Finnhub error: ${res.statusText}`);

        const rawData = await res.json();

        if (!Array.isArray(rawData)) {
            console.error('[News API] Invalid response format:', rawData);
            return NextResponse.json([]);
        }

        const news = rawData.slice(0, 20).map(normalizeNewsItem);

        // Update Cache
        GENERAL_NEWS_CACHE = { data: news, timestamp: now };

        return NextResponse.json(news);

    } catch (error: any) {
        console.error('[News API] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- Helper Functions ---

function normalizeNewsItem(item: any) {
    return {
        id: item.id,
        headline: item.headline,
        summary: item.summary,
        url: item.url,
        source: item.source,
        image: item.image,
        datetime: item.datetime * 1000, // Convert to ms
        category: item.category || item.related || 'general',
        isCritical: false // Default, will be updated by Sentinel
    };
}

function applySentinelAnalysis(news: any[], portfolioTickers: string[]): any[] {
    return news.map(item => {
        const headlineLower = (item.headline || '').toLowerCase();
        const summaryLower = (item.summary || '').toLowerCase();
        const textToScan = headlineLower + ' ' + summaryLower;

        // Check for critical keywords
        const hasCriticalKeyword = CRITICAL_KEYWORDS.some(keyword => textToScan.includes(keyword));

        // Check if it mentions a portfolio stock
        const mentionsPortfolio = portfolioTickers.some(ticker => {
            const tickerClean = ticker.replace('.ST', '').replace('.HE', '').toLowerCase();
            return textToScan.includes(tickerClean);
        });

        // Mark as critical if BOTH conditions are met
        if (hasCriticalKeyword && (mentionsPortfolio || item.ticker)) {
            console.log(`[Sentinel] 🚨 CRITICAL: "${item.headline.substring(0, 50)}..."`);
            return { ...item, isCritical: true };
        }

        return item;
    });
}

function getDateString(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
}
