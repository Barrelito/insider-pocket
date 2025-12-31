import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { FALLBACK_STOCKS } from '@/lib/fallbackStocks';

// Create an instance of YahooFinance (required in v3)
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    const normalizedQuery = query.toLowerCase();

    try {
        console.log(`[Search API] Searching for: ${query}`);

        const result = await yahooFinance.search(query, {
            quotesCount: 10,
            newsCount: 0,
        }) as any;

        if (!result || !result.quotes) {
            console.log(`[Search API] No quotes in result, checking fallback...`);
            throw new Error("No remote results");
        }

        // Filter and map results - accept all with symbol
        const results = result.quotes
            .filter((q: any) => q && q.symbol)
            .slice(0, 10)
            .map((q: any) => ({
                symbol: q.symbol,
                shortname: q.shortname || q.longname || q.symbol,
                exchange: q.exchange || 'N/A',
                typeDisp: q.typeDisp || q.quoteType || 'Stock'
            }));

        console.log(`[Search API] Returning ${results.length} results from Yahoo`);
        return NextResponse.json({ results });

    } catch (error: any) {
        console.error(`[Search API] Yahoo Error (${error.message || error}). Switching to Fallback.`);

        // FALLBACK LOGIC
        // Search local list for matches in symbol or shortname
        const fallbackResults = FALLBACK_STOCKS.filter(stock =>
            stock.symbol.toLowerCase().includes(normalizedQuery) ||
            stock.shortname.toLowerCase().includes(normalizedQuery)
        );

        console.log(`[Search API] Found ${fallbackResults.length} fallback matches.`);

        return NextResponse.json({
            results: fallbackResults,
            fromFallback: true,
            error: null // Clear error so frontend shows results
        });
    }
}
