import { useState, useEffect } from 'react';
import { PortfolioItem, QuoteData, Stock } from '@/lib/types';

const STORAGE_KEY = 'insider-portfolio';

export interface EnrichedStock extends Stock {
    quantity: number;
    value: number; // Value in SEK (normalized)
    originalValue: number; // Value in native currency
    history: number[];
}

export function usePortfolio() {
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [prices, setPrices] = useState<Record<string, QuoteData>>({});
    const [forexRate, setForexRate] = useState<number>(10.5); // Default fallback
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Load from LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse portfolio", e);
            }
        }
        setInitialized(true);
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (initialized) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
    }, [items, initialized]);

    // Fetch Wrapper
    const fetchQuote = async (ticker: string) => {
        try {
            const res = await fetch(`/api/quote?ticker=${ticker}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return await res.json();
        } catch (error) {
            // console.error(error); 
            return null;
        }
    };

    const refreshPrices = async () => {
        // Always fetch Forex first/parallel
        setLoading(true);

        // 1. Fetch Forex (USD/SEK)
        // Yahoo symbol for USD/SEK is "SEK=X" (Quote returns price in SEK)
        const forexPromise = fetchQuote('SEK=X');

        // 2. Fetch Stocks
        const titlePromises = items.map(item => fetchQuote(item.ticker));

        const [forexData, ...stockResults] = await Promise.all([forexPromise, ...titlePromises]);

        // Update Forex
        if (forexData && forexData.price) {
            setForexRate(forexData.price);
        }

        // Update Stocks
        const newPrices: Record<string, QuoteData> = {};
        stockResults.forEach((data, index) => {
            if (data && items[index]) {
                newPrices[items[index].ticker] = data;
            }
        });

        setPrices(prev => ({ ...prev, ...newPrices }));
        setLoading(false);
    };

    // Initial fetch
    useEffect(() => {
        if (initialized) {
            refreshPrices(); // Fetch even if empty to get Forex? No, only needed if stocks exist.
            // Actually, let's fetch forex if we have any USD stocks, but easier to just fetch always if items > 0
            if (items.length > 0) refreshPrices();
        }
    }, [initialized, items.length]);

    // Actions
    const addStock = (ticker: string, quantity: number) => {
        const newItem: PortfolioItem = {
            id: crypto.randomUUID(),
            ticker: ticker.toUpperCase(),
            quantity,
            avgPrice: 0
        };
        setItems(prev => [...prev, newItem]);
    };

    const removeStock = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    // Compute Enriched Data
    const enrichedStocks: EnrichedStock[] = items.map(item => {
        const quote = prices[item.ticker];
        if (!quote) {
            return {
                id: item.id,
                name: item.ticker,
                ticker: item.ticker,
                price: 0,
                currency: '...',
                changeAmount: 0,
                changePercent: 0,
                isPositive: true,
                logoPlaceholder: item.ticker.substring(0, 2),
                quantity: item.quantity,
                value: 0,
                originalValue: 0,
                history: []
            };
        }

        const nativeValue = quote.price * item.quantity;

        // Normalize to SEK
        let sekValue = nativeValue;
        if (quote.currency === 'USD') {
            sekValue = nativeValue * forexRate;
        }
        // Add other currencies here if needed (EUR=X etc)

        return {
            id: item.id,
            name: quote.shortName,
            ticker: quote.symbol,
            price: quote.price,
            currency: quote.currency,
            changeAmount: quote.changeAmount,
            changePercent: quote.changePercent,
            isPositive: quote.changeAmount >= 0,
            logoPlaceholder: quote.shortName.substring(0, 2),
            quantity: item.quantity,
            originalValue: nativeValue,
            value: sekValue,
            history: quote.history || []
        };
    });

    const totalValueSEK = enrichedStocks.reduce((sum, stock) => sum + stock.value, 0);

    // Calculate weighted daily change in SEK
    // We need to approximation: ChangeSEK = ChangeNative * Quantity * Rate
    const totalChangeAmountSEK = enrichedStocks.reduce((sum, stock) => {
        const rate = stock.currency === 'USD' ? forexRate : 1;
        return sum + (stock.changeAmount * stock.quantity * rate);
    }, 0);

    const portfolioPrevValue = totalValueSEK - totalChangeAmountSEK;
    const totalChangePercent = portfolioPrevValue > 0 ? (totalChangeAmountSEK / portfolioPrevValue) * 100 : 0;

    return {
        stocks: enrichedStocks,
        totalValue: totalValueSEK,
        totalChangeAmount: totalChangeAmountSEK,
        totalChangePercent,
        forexRate,
        loading,
        addStock,
        removeStock,
        refreshPrices
    };
}
