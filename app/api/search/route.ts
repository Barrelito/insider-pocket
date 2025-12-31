import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        const result = await yahooFinance.search(query, { quotesCount: 10, newsCount: 0 }) as any;

        // Filter and map results
        const results = result.quotes
            .filter((q: any) => q.isYahooFinance === true && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND'))
            .map((q: any) => ({
                symbol: q.symbol,
                shortname: q.shortname || q.longname || q.symbol,
                exchange: q.exchange,
                typeDisp: q.typeDisp || q.quoteType
            }));

        return NextResponse.json({ results });
    } catch (error) {
        console.error(`Error searching for ${query}:`, error);
        return NextResponse.json({ results: [] }, { status: 500 });
    }
}
