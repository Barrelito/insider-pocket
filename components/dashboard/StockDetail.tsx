import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, VenetianMask } from 'lucide-react';
import Sparkline from '@/components/ui/Sparkline';

interface InsiderTransaction {
    holderName: string;
    role?: string; // NEW: Person's position (e.g., "VD", "Styrelseledamot")
    transactionText: string;
    date: string;
    shares: string;
    value: string;
    isBuy: boolean;
}

interface StockDetailProps {
    ticker: string;
    onClose: () => void;
}

export default function StockDetail({ ticker, onClose }: StockDetailProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/details?ticker=${ticker}`);
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [ticker]);

    // Loading Skeleton
    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-lg bg-[#111] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 h-[85vh] sm:h-auto animate-pulse">
                    <div className="h-8 w-32 bg-zinc-800 rounded mb-4" />
                    <div className="h-40 w-full bg-zinc-800 rounded mb-6" />
                    <div className="h-6 w-48 bg-zinc-800 rounded mb-2" />
                    <div className="space-y-2">
                        <div className="h-12 w-full bg-zinc-800 rounded" />
                        <div className="h-12 w-full bg-zinc-800 rounded" />
                        <div className="h-12 w-full bg-zinc-800 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const isPositive = (data.price?.regularMarketChange || 0) >= 0;

    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-[#000] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 h-[85vh] sm:h-[80vh] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-start mb-6 shrink-0">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">{data.price?.shortName || ticker}</h2>
                        <div className="flex items-baseline gap-3 mt-1">
                            <span className="text-2xl font-mono-numbers text-white">{data.price?.currencySymbol}{data.price?.regularMarketPrice}</span>
                            <span className={`flex items-center gap-1 font-mono-numbers font-medium ${isPositive ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-red)]'}`}>
                                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                {data.price?.regularMarketChangePercent?.fmt}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Chart (Reuse Sparkline but bigger) */}
                <div className="w-full h-32 mb-8 shrink-0 relative">
                    <div className="absolute inset-x-0 bottom-0 h-full opacity-20 bg-gradient-to-t from-[var(--color-neon-green)] to-transparent" style={{ opacity: isPositive ? 0.2 : 0 }} />
                    <Sparkline data={data.history} isPositive={isPositive} />
                </div>

                {/* Insider Transactions */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="flex items-center gap-2 mb-4 sticky top-0 bg-black py-2 z-10 border-b border-white/5">
                        <VenetianMask size={20} className="text-zinc-500" />
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Insider Moves</h3>
                    </div>

                    <div className="space-y-3">
                        {(!data.insiderTransactions || data.insiderTransactions.length === 0) ? (
                            <div className="text-center py-8 text-zinc-600 italic">
                                No recent insider activity detected.
                                <br />
                                <span className="text-xs not-italic text-zinc-700">(Common for Funds/ETFs)</span>
                            </div>
                        ) : (
                            data.insiderTransactions.map((t: InsiderTransaction, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className="text-white font-medium text-sm truncate">{t.holderName}</span>
                                        {t.role && <span className="text-[10px] text-zinc-400 truncate">{t.role}</span>}
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{t.transactionText} • {t.date}</span>
                                    </div>
                                    <div className={`text-right font-mono-numbers text-sm font-bold ${t.isBuy ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-red)]'}`}>
                                        {t.isBuy ? '+' : '-'}{t.shares}
                                        <div className="text-[10px] text-zinc-500 font-normal">SHARES</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
