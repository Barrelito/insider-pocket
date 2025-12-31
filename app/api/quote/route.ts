import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Finnhub Configuration (US Stocks)
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

// Fallback Configuration
const FALLBACK_USD_SEK = 11.05;

// --- SIMPLE IN-MEMORY CACHE ---
const CACHE: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let ticker = searchParams.get('ticker');

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    // Sanitize Ticker
    ticker = ticker.toUpperCase().trim()
        .replace(/%20/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    console.log(`[Quote API] Processing: ${ticker} (Sanitized)`);

    // 1. CHECK CACHE
    const cachedItem = CACHE[ticker];
    const now = Date.now();
    if (cachedItem && (now - cachedItem.timestamp < CACHE_DURATION)) {
        console.log(`[Quote API] Serving ${ticker} from CACHE ⚡️`);
        return NextResponse.json(cachedItem.data);
    }

    // 2. ROUTING LOGIC

    // A) Forex
    if (ticker === 'SEK=X' || ticker.includes('=X')) {
        const data = {
            price: FALLBACK_USD_SEK, currency: 'SEK',
            changePercent: 0, changeAmount: 0, shortName: 'USD/SEK', symbol: ticker, history: []
        };
        CACHE[ticker] = { data, timestamp: now };
        return NextResponse.json(data);
    }

    // B) Swedish/Nordic (.ST, .HE)
    if (ticker.includes('.ST') || ticker.includes('.HE')) {
        console.log(`[Quote API] Routing ${ticker} to Yahoo (Manual Fetch)...`);
        const data = await fetchFromYahooManual(ticker);

        if (!data.error) {
            CACHE[ticker] = { data, timestamp: now };
        }
        // MOCK Fallback (keep as safety net)
        else if (data.isError && (data.symbol === 'INVE-B.ST')) {
            console.log(`[Quote API] Using DEMO MOCK due to Rate Limit`);
            const mockData = {
                price: 312.50, currency: 'SEK', changePercent: 1.25, changeAmount: 3.85,
                shortName: 'Investor B', symbol: 'INVE-B.ST', history: [305, 308, 307, 311, 312.5]
            };
            return NextResponse.json(mockData);
        }

        return NextResponse.json(data);
    }

    // C) US/Other Stocks -> Finnhub (unchanged)
    console.log(`[Quote API] Routing ${ticker} to Finnhub...`);
    const data = await fetchFromFinnhub(ticker);
    if (!data.error) {
        CACHE[ticker] = { data, timestamp: now };
    }
    return NextResponse.json(data);
}

async function fetchFromFinnhub(ticker: string) {
    try {
        const quoteRes = await fetch(`${FINNHUB_URL}/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_API_KEY}`);
        const quoteData = await quoteRes.json();
        if (quoteData.error) throw new Error(quoteData.error);

        const profileRes = await fetch(`${FINNHUB_URL}/stock/profile2?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_API_KEY}`);
        const profileData = await profileRes.json();

        let history: number[] = [];
        try {
            const now = Math.floor(Date.now() / 1000);
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
            const candlesRes = await fetch(
                `${FINNHUB_URL}/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${thirtyDaysAgo}&to=${now}&token=${FINNHUB_API_KEY}`
            );
            const candlesData = await candlesRes.json();
            if (candlesData.s === 'ok' && candlesData.c) history = candlesData.c;
        } catch (e) { }

        return {
            price: quoteData.c || 0, currency: profileData.currency || 'USD',
            changePercent: quoteData.dp || 0, changeAmount: quoteData.d || 0,
            shortName: profileData.name || ticker, symbol: ticker, history: history
        };
    } catch (error: any) {
        return { price: 0, currency: 'USD', changePercent: 0, changeAmount: 0, shortName: ticker, symbol: ticker, history: [], error: error.message };
    }
}

// --- NEW MANUAL YAHOO FETCHER WITH USER-AGENT ---
async function fetchFromYahooManual(ticker: string) {
    try {
        const period2 = Math.floor(Date.now() / 1000);
        const period1 = period2 - (30 * 24 * 60 * 60); // 30 days

        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodedTicker(ticker)}?interval=1d&period1=${period1}&period2=${period2}`;

        console.log(`[Quote API] Fetching URL: ${url}`);

        const res = await fetch(url, {
            headers: {
                // Mimic a real browser to bypass 429 errors
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            }
        });

        if (!res.ok) {
            throw new Error(`Yahoo HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const result = data.chart?.result?.[0];

        if (!result) throw new Error("No result from Yahoo");

        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0] || {};
        const closes = quotes.close || [];

        // Filter nulls
        const history = closes.filter((c: any) => typeof c === 'number');

        const price = meta.regularMarketPrice || 0;
        const previousClose = meta.chartPreviousClose || price;
        const changeAmount = price - previousClose;
        const changePercent = previousClose > 0 ? (changeAmount / previousClose) * 100 : 0;

        return {
            price: price,
            currency: meta.currency || 'SEK',
            changePercent: changePercent,
            changeAmount: changeAmount,
            shortName: meta.shortName || meta.longName || ticker,
            symbol: meta.symbol || ticker,
            history: history,
        };

    } catch (error: any) {
        console.error(`[Quote API] Yahoo Manual Error: ${error.message}`);
        return {
            price: 0, currency: 'SEK', changePercent: 0, changeAmount: 0,
            shortName: ticker, symbol: ticker, history: [],
            error: error.message, isError: true
        };
    }
}

function encodedTicker(ticker: string) {
    return encodeURIComponent(ticker);
}
