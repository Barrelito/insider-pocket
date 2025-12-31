import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchResult {
    symbol: string;
    shortname: string;
    exchange: string;
    typeDisp: string;
}

interface StockSearchProps {
    onSelect: (ticker: string) => void;
    initialValue?: string;
}

export default function StockSearch({ onSelect, initialValue = "" }: StockSearchProps) {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce logic
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.results || []);
                setIsOpen(true);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (result: SearchResult) => {
        setQuery(result.symbol);
        onSelect(result.symbol);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative z-[200]">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onSelect(e.target.value); // Allow free text typing too
                    }}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder="Search (e.g. Tesla, Investor...)"
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-[var(--color-neon-green)] focus:ring-1 focus:ring-[var(--color-neon-green)] transition-all font-mono-numbers uppercase"
                    autoFocus
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="absolute w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-[300]">
                    {results.map((result) => (
                        <button
                            key={result.symbol}
                            onClick={() => handleSelect(result)}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800/50 last:border-0 transition-colors group"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-white group-hover:text-[var(--color-neon-green)]">{result.symbol}</span>
                                <span className="text-[10px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded">{result.exchange}</span>
                            </div>
                            <div className="text-xs text-zinc-400 truncate mt-0.5">{result.shortname}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
