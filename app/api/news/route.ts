import { NextResponse } from 'next/server';

// Finnhub Configuration
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

// Cache Configuration
const CACHE: { data: any; timestamp: number } | null = null;
let GENERAL_NEWS_CACHE: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';

    // Check Cache
    const now = Date.now();
    if (category === 'general' && GENERAL_NEWS_CACHE && (now - GENERAL_NEWS_CACHE.timestamp < CACHE_DURATION)) {
        console.log('[News API] Serving General News from CACHE ⚡️');
        return NextResponse.json(GENERAL_NEWS_CACHE.data);
    }

    if (!FINNHUB_API_KEY) {
        return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    try {
        console.log(`[News API] Fetching ${category} news from Finnhub...`);
        const res = await fetch(`${FINNHUB_URL}/news?category=${category}&token=${FINNHUB_API_KEY}`);

        if (!res.ok) throw new Error(`Finnhub error: ${res.statusText}`);

        const rawData = await res.json();

        if (!Array.isArray(rawData)) {
            // Finnhub sometimes returns an error object or empty string
            console.error('[News API] Invalid response format:', rawData);
            return NextResponse.json([]);
        }

        // Normalize Data
        const news = rawData.slice(0, 20).map((item: any) => ({
            id: item.id,
            headline: item.headline,
            summary: item.summary,
            url: item.url,
            source: item.source,
            image: item.image,
            datetime: item.datetime * 1000, // Convert to ms
            category: item.category
        }));

        // Update Cache
        if (category === 'general') {
            GENERAL_NEWS_CACHE = { data: news, timestamp: now };
        }

        return NextResponse.json(news);

    } catch (error: any) {
        console.error('[News API] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
