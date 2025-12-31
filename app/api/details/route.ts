import { NextResponse } from 'next/server';

// Finnhub Configuration (US Stocks)
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let ticker = searchParams.get('ticker');

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    // Sanitize Ticker (Same as Quote API)
    ticker = ticker.toUpperCase().trim()
        .replace(/%20/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    console.log(`[Details API] Fetching details for: ${ticker}`);

    // B) Swedish/Nordic (.ST, .HE) -> Yahoo Finance (Hybrid/Stealth) + FI Scraper
    if (ticker.includes('.ST') || ticker.includes('.HE')) {
        console.log(`[Details API] Routing ${ticker} to Yahoo (Stealth Mode) + FI Scraper...`);

        // 1. Fetch Chart & Price from Yahoo
        const yahooData = await fetchFromYahooManual(ticker);

        // 2. Fetch Insider Data from FI (if it's a Swedish .ST stock)
        if (ticker.includes('.ST')) {
            try {
                // Dynamic import to avoid critical dependency issues if scraper fails
                const { scrapeFiInsider } = await import('@/lib/fi-scraper');

                // Use the company name from Yahoo (e.g., "Investor AB ser. B")
                // The scraper handles cleaning (removing "AB", "ser. B", etc.)
                const companyName = yahooData.price.shortName || ticker;
                const transactions = await scrapeFiInsider(companyName);

                if (transactions.length > 0) {
                    yahooData.insiderTransactions = transactions;
                }
            } catch (e: any) {
                console.error(`[Details API] Scraper Failed: ${e.message}`);
            }
        }

        return NextResponse.json(yahooData);
    }

    // C) US/Other Stocks -> Finnhub (Standard)
    console.log(`[Details API] Routing ${ticker} to Finnhub...`);
    return fetchFromFinnhub(ticker);
}

// --- FETCHERS ---

// 1. Finnhub (US Stocks) - Keep existing logic
async function fetchFromFinnhub(ticker: string) {
    // Prepare response structure
    const response: any = {
        price: { shortName: ticker, regularMarketPrice: 0, regularMarketChange: 0, regularMarketChangePercent: { fmt: '0.00%' }, currencySymbol: '$' },
        insiderTransactions: [], history: []
    };

    try {
        // Fetch Quote
        const quoteRes = await fetch(`${BASE_URL}/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_API_KEY}`);
        const quoteData = await quoteRes.json();

        // Fetch Profile
        const profileRes = await fetch(`${BASE_URL}/stock/profile2?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_API_KEY}`);
        const profileData = await profileRes.json();

        // Fetch Candles (90 days)
        const now = Math.floor(Date.now() / 1000);
        const ninetyDaysAgo = now - (90 * 24 * 60 * 60);
        const candlesRes = await fetch(`${BASE_URL}/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${ninetyDaysAgo}&to=${now}&token=${FINNHUB_API_KEY}`);
        const candlesData = await candlesRes.json();

        // Fetch Insider Transactions
        const insiderRes = await fetch(`${BASE_URL}/stock/insider-transactions?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_API_KEY}`);
        const insiderData = await insiderRes.json();

        // Build Price Data
        response.price = {
            shortName: profileData.name || ticker,
            regularMarketPrice: quoteData.c || 0,
            regularMarketChange: quoteData.d || 0,
            regularMarketChangePercent: { fmt: `${(quoteData.dp || 0).toFixed(2)}%` },
            currencySymbol: profileData.currency === 'USD' ? '$' : (profileData.currency === 'SEK' ? 'kr' : profileData.currency || '$')
        };

        // Build History
        response.history = candlesData.s === 'ok' && candlesData.c ? candlesData.c : [];

        // Build Insider Transactions
        if (insiderData.data && insiderData.data.length > 0) {
            response.insiderTransactions = insiderData.data.slice(0, 10).map((t: any) => ({
                holderName: t.name || 'Unknown',
                transactionText: t.transactionCode === 'P' ? 'Purchase' : t.transactionCode === 'S' ? 'Sale' : t.transactionCode || 'Transaction',
                date: t.transactionDate || 'N/A',
                shares: t.share?.toLocaleString() || '0',
                value: t.change ? `$${Math.abs(t.change).toLocaleString()}` : 'N/A',
                isBuy: t.transactionCode === 'P' || t.change > 0
            }));
        }

        console.log(`[Details API] Success: price=${response.price.regularMarketPrice}`);
        return NextResponse.json(response);

    } catch (error: any) {
        console.error(`[Details API] Error for ${ticker}:`, error.message);
        response.error = error.message;
        return NextResponse.json(response);
    }
}

// 2. Yahoo Manual Stealth (Swedish Stocks)
async function fetchFromYahooManual(ticker: string) {
    const response: any = {
        price: { shortName: ticker, regularMarketPrice: 0, regularMarketChange: 0, regularMarketChangePercent: { fmt: '0.00%' }, currencySymbol: 'kr' },
        insiderTransactions: [], history: [], isError: false
    };

    try {
        const period2 = Math.floor(Date.now() / 1000);
        const period1 = period2 - (90 * 24 * 60 * 60); // 90 days for detail view

        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&period1=${period1}&period2=${period2}`;
        console.log(`[Details API] Fetching Yahoo URL: ${url}`);

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Connection': 'keep-alive',
            }
        });

        if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);

        const data = await res.json();
        const result = data.chart?.result?.[0];

        if (!result) throw new Error("No result from Yahoo");

        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0] || {};
        const closes = quotes.close || [];
        const history = closes.filter((c: any) => typeof c === 'number');

        const price = meta.regularMarketPrice || 0;
        const previousClose = meta.chartPreviousClose || price;
        const changeAmount = price - previousClose;
        const changePercent = previousClose > 0 ? (changeAmount / previousClose) * 100 : 0;

        response.price = {
            shortName: meta.shortName || meta.longName || ticker,
            regularMarketPrice: price,
            regularMarketChange: changeAmount,
            regularMarketChangePercent: { fmt: `${changePercent.toFixed(2)}%` },
            currencySymbol: meta.currency === 'USD' ? '$' : 'kr'
        };
        response.history = history;
        // Note: Yahoo Chart API doesn't provide insider transactions. We return empty [] effectively.

        return response;

    } catch (error: any) {
        console.error(`[Details API] Yahoo Error: ${error.message}`);
        response.error = error.message;
        response.isError = true;
        return response;
    }
}

// 3. Mock Data for Demo
function getMockInvestorData() {
    return {
        price: {
            shortName: 'Investor AB ser. B',
            regularMarketPrice: 312.50,
            regularMarketChange: 3.85,
            regularMarketChangePercent: { fmt: '+1.25%' },
            currencySymbol: 'kr'
        },
        history: [305, 308, 306, 310, 312, 311, 312.50],
        insiderTransactions: [
            {
                holderName: 'Wallenberg Jacob',
                transactionText: 'Purchase',
                date: '2024-12-15',
                shares: '50,000',
                value: '15,000,000 kr',
                isBuy: true
            },
            {
                holderName: 'Ekholm Borje',
                transactionText: 'Sale',
                date: '2024-11-20',
                shares: '10,000',
                value: '3,000,000 kr',
                isBuy: false
            }
        ]
    };
}
