"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/ui/BottomNav";
import PortfolioSummaryDisplay from "@/components/dashboard/PortfolioSummary";
import StockCard from "@/components/dashboard/StockCard";
import AddStockDialog from "@/components/ui/AddStockDialog";
import StockDetail from "@/components/dashboard/StockDetail";
import NewsFeed from "@/components/views/NewsFeed";
import { usePortfolio } from "@/hooks/usePortfolio";
import { CircuitBoard, Plus, RefreshCw, Loader2 } from "lucide-react";

export default function Home() {
  const {
    stocks,
    totalValue,
    totalChangeAmount,
    totalChangePercent,
    loading,
    addStock,
    removeStock,
    refreshPrices
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState("portfolio");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  // News State
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Fetch News when tab changes to 'news'
  useEffect(() => {
    if (activeTab === 'news' && news.length === 0) {
      const fetchNews = async () => {
        setNewsLoading(true);
        try {
          const res = await fetch('/api/news');
          const data = await res.json();
          setNews(data);
        } catch (e) {
          console.error("Failed to fetch news", e);
        } finally {
          setNewsLoading(false);
        }
      };
      fetchNews();
    }
  }, [activeTab]);

  // Derived state for the summary view
  const isPositive = totalChangeAmount >= 0;

  return (
    <main className="min-h-screen relative pb-32 font-sans selection:bg-[var(--color-neon-green)] selection:text-black">

      {/* Header / Logo Area */}
      <header className="pt-8 pb-4 px-6 flex items-center justify-between sticky top-0 z-40 bg-black/50 backdrop-blur-md border-b border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <CircuitBoard size={28} className="text-zinc-500" />
            <div className="absolute inset-0 bg-red-500/20 blur-lg rounded-full" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 ml-0.5">THE</span>
            <h1 className="text-xl font-bold tracking-widest text-white uppercase flex items-center gap-2">
              <span className="text-zinc-300">INSIDER</span>
              <span className="text-zinc-500">POCKET</span>
            </h1>
          </div>
        </div>

        {/* Action Buttons (Only show on Portfolio tab) */}
        {activeTab === 'portfolio' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <button
              onClick={refreshPrices}
              disabled={loading}
              className={`p-2 rounded-full border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all ${loading ? "animate-spin" : ""}`}
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="p-2 rounded-full bg-[var(--color-neon-green)] text-black hover:bg-[#2ed60f] transition-all shadow-[0_0_10px_rgba(57,255,20,0.3)]"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <div className="px-4 max-w-md mx-auto mt-6 space-y-6">

        {/* --- PORTFOLIO VIEW --- */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-500">
            {/* Portfolio Summary Section */}
            <section>
              <PortfolioSummaryDisplay
                totalValue={totalValue}
                currency="SEK"
                changeAmount={totalChangeAmount}
                changePercent={totalChangePercent}
                isPositive={isPositive}
              />
            </section>

            {/* Stock List Section */}
            <section>
              {stocks.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 border border-dashed border-zinc-800 rounded-3xl">
                  <p>Your pocket is empty.</p>
                  <button onClick={() => setIsAddOpen(true)} className="mt-2 text-[var(--color-neon-green)] text-sm font-bold uppercase tracking-wider">
                    Add your first stock
                  </button>
                </div>
              ) : (
                <div>
                  {stocks.map((stock) => (
                    <StockCard
                      key={stock.id}
                      stock={stock}
                      onDelete={removeStock}
                      isLoading={loading && stock.price === 0}
                      onClick={(s) => setSelectedStock(s.ticker)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* --- NEWS VIEW --- */}
        {activeTab === 'news' && (
          <div className="animate-in slide-in-from-bottom-5 fade-in duration-500">
            <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">Market Pulse</h2>
            {newsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-[var(--color-neon-green)]" size={32} />
              </div>
            ) : (
              <NewsFeed news={news} />
            )}
          </div>
        )}

        {/* --- OTHER TABS (Placeholder) --- */}
        {(activeTab === 'home' || activeTab === 'markets' || activeTab === 'settings') && (
          <div className="text-center py-20 text-zinc-600 animate-in fade-in">
            <p className="italic">Coming soon...</p>
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add Dialog */}
      <AddStockDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={addStock}
      />

      {/* Stock Detail View */}
      {selectedStock && (
        <StockDetail
          ticker={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}

      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-screen pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[var(--color-neon-green)] opacity-[0.03] blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-[var(--color-neon-red)] opacity-[0.02] blur-[100px] rounded-full" />
      </div>

    </main>
  );
}
