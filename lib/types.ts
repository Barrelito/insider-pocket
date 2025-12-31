export interface Stock {
    id: string;
    name: string;
    ticker: string;
    price: number;
    currency: "SEK" | "USD" | string;
    changeAmount: number;
    changePercent: number;
    isPositive: boolean;
    logoPlaceholder: string;
}

export interface PortfolioSummary {
    totalValue: number;
    currency: "SEK";
    dayChangeAmount: number;
    dayChangePercent: number;
    isPositive: boolean;
}

export interface PortfolioItem {
    id: string;
    ticker: string;
    quantity: number;
    avgPrice: number;
}

export interface QuoteData {
    price: number;
    currency: string;
    changePercent: number;
    changeAmount: number;
    shortName: string;
    symbol: string;
    history: number[]; // Sparkline data (closes)
}
