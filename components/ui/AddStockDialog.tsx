import { useState } from "react";
import { Plus, X } from "lucide-react";

interface AddStockDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (ticker: string, quantity: number) => void;
}

export default function AddStockDialog({ isOpen, onClose, onAdd }: AddStockDialogProps) {
    const [ticker, setTicker] = useState("");
    const [quantity, setQuantity] = useState("1");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ticker && quantity) {
            onAdd(ticker, parseFloat(quantity));
            setTicker("");
            setQuantity("1");
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
                {/* Green Glow effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-neon-green)] to-transparent" />

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white tracking-wide">Add Asset</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Ticker Symbol</label>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            placeholder="e.g. TSLA, INVE-B.ST"
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-[var(--color-neon-green)] focus:ring-1 focus:ring-[var(--color-neon-green)] transition-all uppercase font-mono-numbers"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            step="any"
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-[var(--color-neon-green)] focus:ring-1 focus:ring-[var(--color-neon-green)] transition-all font-mono-numbers"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-4 bg-[var(--color-neon-green)] text-black font-bold py-3.5 rounded-xl hover:bg-[#2ed60f] transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={20} strokeWidth={3} />
                        <span>ADD TO POCKET</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
