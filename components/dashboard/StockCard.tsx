import { EnrichedStock } from "@/hooks/usePortfolio";
import { ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import Sparkline from "@/components/ui/Sparkline";

interface StockCardProps {
    stock: EnrichedStock;
    onDelete?: (id: string) => void;
    isLoading?: boolean;
}

export default function StockCard({ stock, onDelete, isLoading = false }: StockCardProps) {
    // Skeleton Loading State
    if (isLoading) {
        return (
            <div className="relative flex items-center justify-between p-4 bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-2xl mb-3 overflow-hidden animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5" />
                    <div className="flex flex-col gap-2">
                        <div className="h-4 w-24 bg-white/5 rounded" />
                        <div className="h-3 w-16 bg-white/5 rounded" />
                    </div>
                </div>
                <div className="h-8 w-24 bg-white/5 rounded" />
                <div className="flex flex-col items-end gap-2">
                    <div className="h-4 w-20 bg-white/5 rounded" />
                    <div className="h-3 w-12 bg-white/5 rounded" />
                </div>
            </div>
        );
    }

    const formatMoney = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(val);

    return (
        <div className="group relative flex items-center justify-between p-4 bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-2xl mb-3 overflow-hidden">

            {/* Left: Icon & Name */}
            <div className="flex items-center gap-4 relative z-10 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-white/5 shrink-0">
                    <span className="text-zinc-500 font-bold text-lg">{stock.logoPlaceholder}</span>
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="text-white font-medium text-lg leading-tight truncate pr-2 max-w-[120px]">{stock.name}</span>
                    <span className="text-zinc-500 text-xs font-mono-numbers uppercase tracking-wider mt-0.5">
                        {stock.quantity} SHARES • {stock.ticker}
                    </span>
                </div>
            </div>

            {/* Middle: Sparkline (Hidden on very small screens if crowded, but fitting here) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none opacity-50">
                <Sparkline data={stock.history} isPositive={stock.isPositive} />
            </div>

            {/* Right: Price & Change */}
            <div className="flex flex-col items-end relative z-10 pointer-events-none">
                <div className="text-white font-mono-numbers text-lg font-medium tracking-wide">
                    {formatMoney(stock.price)}
                    <span className="text-sm text-zinc-400 ml-1">{stock.currency}</span>
                </div>

                <div className={`flex items-center gap-1 text-xs font-mono-numbers font-medium ${stock.isPositive ? "text-[var(--color-neon-green)]" : "text-[var(--color-neon-red)]"}`}>
                    <span>{stock.isPositive ? "+" : ""}{Math.abs(stock.changeAmount).toFixed(2)}</span>
                    <span>({stock.isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)</span>
                    {stock.isPositive ? <ArrowUpRight size={14} className="stroke-[2.5]" /> : <ArrowDownRight size={14} className="stroke-[2.5]" />}
                </div>
            </div>

            {/* Mobile Sparkline (If strictly needed, can be background or under price, but overlapping might be messy. Keeping centered one for now.) */}

            {/* Delete Button */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(stock.id);
                    }}
                    className="absolute right-0 top-0 h-full w-20 bg-red-900/10 hover:bg-red-900/30 border-l border-red-500/10 flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-200 z-20 cursor-pointer backdrop-blur-sm"
                    title="Remove Stock"
                >
                    <Trash2 size={20} className="text-red-500" />
                </button>
            )}
        </div>
    );
}
