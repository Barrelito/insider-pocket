import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    try {
        // 1-month range, 1-day interval gives us ~20-30 data points for a smooth sparkline
        const result = await yahooFinance.chart(ticker, { range: '1mo', interval: '1d' }) as any;

        // The library returns an object with `meta` (current info) and `quotes` (history) or `timestamp`+`indicators`
        // yahoo-finance2 chart result structure typically: { meta: {...}, quotes: [...] }
        const meta = result.meta;
        const quotes = result.quotes || [];

        // Filter nulls and extract closes
        const history = quotes
            .map((q: any) => q.close)
            .filter((c: any) => typeof c === 'number');

        const data = {
            price: meta.regularMarketPrice,
            currency: meta.currency,
            changePercent: meta.regularMarketPrice - meta.chartPreviousClose, // Calculate dynamically or use meta
            changeAmount: meta.regularMarketPrice - meta.chartPreviousClose,
            // Note: meta often has regularMarketPrice, but change info might need calculation if not explicit in meta
            // Let's rely on meta's own change fields if available, otherwise calculate
            shortName: meta.shortName || meta.longName || ticker,
            symbol: meta.symbol,
            history: history,
        };

        // Refine change calculation if meta has it directly
        // Usually chart meta has `chartPreviousClose` and `regularMarketPrice`
        const diff = data.price - meta.chartPreviousClose;
        data.changeAmount = diff;
        data.changePercent = (diff / meta.chartPreviousClose) * 100;

        return NextResponse.json(data);
    } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch stock data', details: String(error) },
            { status: 500 }
        );
    }
}
