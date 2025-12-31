import { NextResponse } from 'next/server';
import { FALLBACK_STOCKS } from '@/lib/fallbackStocks';

// Hardcoded temporarily for testing
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    const normalizedQuery = query.toLowerCase();

    console.log(`[Search API] Searching for: ${query}`);

    try {
        const res = await fetch(
            `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
        );
        const data = await res.json();

        if (data.result && data.result.length > 0) {
            const results = data.result
                .filter((item: any) =>
                    item.type === 'Common Stock' ||
                    item.type === 'ETP' ||
                    item.type === 'Mutual Fund' // Allow funds
                )
                .slice(0, 10)
                .map((item: any) => ({
                    symbol: item.symbol,
                    shortname: item.description || item.symbol,
                    exchange: item.displaySymbol?.split(':')[0] || 'US',
                    typeDisp: item.type === 'Mutual Fund' ? 'Fond' : 'Stock',
                    type: item.type === 'Mutual Fund' ? 'fund' : 'stock' // Internal type
                }));

            console.log(`[Search API] Finnhub returned ${results.length} results`);
            return NextResponse.json({ results });
        }

        throw new Error('No Finnhub results');

    } catch (error: any) {
        console.log(`[Search API] Finnhub failed, using fallback. Error: ${error.message}`);

        const fallbackResults = FALLBACK_STOCKS.filter(stock =>
            stock.symbol.toLowerCase().includes(normalizedQuery) ||
            stock.shortname.toLowerCase().includes(normalizedQuery)
        );

        return NextResponse.json({
            results: fallbackResults.slice(0, 10),
            fromFallback: true
        });
    }
}
