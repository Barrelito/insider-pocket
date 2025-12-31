import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Create an instance of YahooFinance (required in v3)
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    try {
        // Calculate period1 (30 days ago) and period2 (now)
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const result = await yahooFinance.chart(ticker, {
            period1: thirtyDaysAgo,
            period2: now,
            interval: '1d'
        }) as any;

        const meta = result.meta;
        const quotes = result.quotes || [];

        // Filter nulls and extract closes for sparkline
        const history = quotes
            .map((q: any) => q.close)
            .filter((c: any) => typeof c === 'number');

        const data = {
            price: meta.regularMarketPrice,
            currency: meta.currency,
            changePercent: 0,
            changeAmount: 0,
            shortName: meta.shortName || meta.longName || ticker,
            symbol: meta.symbol,
            history: history,
        };

        // Calculate change from chartPreviousClose
        if (meta.chartPreviousClose && meta.regularMarketPrice) {
            const diff = data.price - meta.chartPreviousClose;
            data.changeAmount = diff;
            data.changePercent = (diff / meta.chartPreviousClose) * 100;
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch stock data', details: String(error) },
            { status: 500 }
        );
    }
}
