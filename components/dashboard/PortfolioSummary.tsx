import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface PortfolioSummaryDisplayProps {
    totalValue: number;
    currency: string;
    changeAmount: number;
    changePercent: number;
    isPositive: boolean;
}

export default function PortfolioSummaryDisplay({
    totalValue,
    currency,
    changeAmount,
    changePercent,
    isPositive,
    viewMode,
    onViewChange
}: PortfolioSummaryDisplayProps & {
    viewMode: 'total' | 'stocks' | 'funds';
    onViewChange: (mode: 'total' | 'stocks' | 'funds') => void;
}) {

    const formatMoney = (val: number) =>
        new Intl.NumberFormat('sv-SE', { style: 'decimal', minimumFractionDigits: 0 }).format(val);

    const formatChange = (val: number) =>
        new Intl.NumberFormat('sv-SE', { style: 'decimal', minimumFractionDigits: 0 }).format(Math.abs(val));

    return (
        <div className="relative w-full p-6 pt-12 pb-8 rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] overflow-hidden">
            {/* Background Gradient Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-white/5 blur-[50px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
                {/* View Toggles */}
                <div className="flex gap-2 mb-4 p-1 bg-black/40 rounded-lg border border-white/5">
                    {(['total', 'stocks', 'funds'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => onViewChange(mode)}
                            className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all ${viewMode === mode
                                ? 'bg-[var(--color-neon-green)] text-black shadow-[0_0_10px_rgba(46,214,15,0.3)]'
                                : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            {mode === 'total' ? 'Total' : mode === 'stocks' ? 'Aktier' : 'Fonder'}
                        </button>
                    ))}
                </div>

                <h2 className="text-zinc-400 text-sm tracking-wide mb-2 uppercase font-medium">
                    {viewMode === 'total' ? 'Total Portfolio Value' : viewMode === 'stocks' ? 'Stock Holdings' : 'Fund Holdings'}
                </h2>

                <div className="font-mono-numbers text-5xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tracking-tight">
                    {formatMoney(totalValue)} {currency}
                </div>

                <div className={`mt-2 font-mono-numbers text-sm font-medium flex items-center gap-1 ${isPositive ? "text-[var(--color-neon-green)]" : "text-[var(--color-neon-red)]"}`}>
                    <span>{isPositive ? "+" : "-"}{formatChange(changeAmount)} {currency}</span>
                    <span>({isPositive ? "+" : "-"}{Math.abs(changePercent).toFixed(1)}%)</span>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
            </div>

            {/* Chart Placeholder */}
            <div className="mt-8 h-24 w-full relative opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <line x1="0" y1="25" x2="300" y2="25" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <line x1="0" y1="75" x2="300" y2="75" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                    <path
                        d="M0,80 Q50,70 80,60 T150,50 T220,30 T300,10"
                        fill="none"
                        stroke={isPositive ? "var(--color-neon-green)" : "var(--color-neon-red)"}
                        strokeWidth="2"
                        filter={`drop-shadow(0 0 4px ${isPositive ? "var(--color-neon-green)" : "var(--color-neon-red)"})`}
                    />
                </svg>
            </div>
        </div>
    );
}
