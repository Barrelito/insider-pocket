'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import { usePortfolio } from '@/hooks/usePortfolio';

interface NewsItem {
    id: number;
    headline: string;
    summary: string;
    url: string;
    source: string;
    image: string;
    datetime: number;
    category: string;
    isCritical?: boolean;
    ticker?: string;
}

type TabType = 'market' | 'pocket';

export default function NewsFeed() {
    const [activeTab, setActiveTab] = useState<TabType>('market');
    const [generalNews, setGeneralNews] = useState<NewsItem[]>([]);
    const [portfolioNews, setPortfolioNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { stocks } = usePortfolio();

    // Fetch General News on mount
    useEffect(() => {
        fetchGeneralNews();
    }, []);

    // Fetch Portfolio News when tab switches to 'pocket' or stocks change
    useEffect(() => {
        if (activeTab === 'pocket' && stocks.length > 0) {
            fetchPortfolioNews();
        }
    }, [activeTab, stocks]);

    const fetchGeneralNews = async () => {
        try {
            const res = await fetch('/api/news');
            const data = await res.json();
            if (Array.isArray(data)) {
                setGeneralNews(data);
            }
        } catch (e) {
            console.error('Failed to fetch general news', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchPortfolioNews = async () => {
        setLoading(true);
        try {
            const tickers = stocks.map(s => s.ticker).join(',');
            const res = await fetch(`/api/news?tickers=${encodeURIComponent(tickers)}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setPortfolioNews(data);
            }
        } catch (e) {
            console.error('Failed to fetch portfolio news', e);
        } finally {
            setLoading(false);
        }
    };

    const news = activeTab === 'market' ? generalNews : portfolioNews;
    const criticalNews = news.filter(item => item.isCritical);

    return (
        <div className="space-y-4 pb-24">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-xl border border-white/5">
                <TabButton
                    label="Market Pulse"
                    active={activeTab === 'market'}
                    onClick={() => setActiveTab('market')}
                />
                <TabButton
                    label="My Pocket"
                    active={activeTab === 'pocket'}
                    onClick={() => setActiveTab('pocket')}
                />
            </div>

            {/* Sentinel Alerts */}
            {criticalNews.length > 0 && (
                <div className="space-y-2">
                    {criticalNews.map((item) => (
                        <a
                            key={`critical-${item.id}`}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 bg-red-950/40 border-2 border-red-500/50 rounded-xl animate-pulse hover:bg-red-950/60 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                                        🚨 Critical Alert
                                    </p>
                                    <p className="text-white font-medium text-sm leading-snug">
                                        {item.headline}
                                    </p>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-12">
                    <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin" />
                </div>
            )}

            {/* Empty State for My Pocket */}
            {!loading && activeTab === 'pocket' && stocks.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
                        <Plus className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-400 mb-2">No stocks in your portfolio</p>
                    <p className="text-zinc-600 text-sm">Add stocks to see personalized news</p>
                </div>
            )}

            {/* No News for Portfolio */}
            {!loading && activeTab === 'pocket' && stocks.length > 0 && portfolioNews.length === 0 && (
                <div className="text-center py-12 text-zinc-600">
                    <p>No recent news for your portfolio stocks.</p>
                </div>
            )}

            {/* News List */}
            {!loading && news.length > 0 && (
                <div className="space-y-3">
                    {news.filter(item => !item.isCritical).map((item) => (
                        <NewsCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Sub-components ---

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${active
                    ? 'bg-[var(--color-neon-green)] text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {label}
        </button>
    );
}

function NewsCard({ item }: { item: NewsItem }) {
    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group relative bg-[#111] border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all active:scale-[0.98]"
        >
            <div className="flex">
                {/* Image Thumbnail (Left) */}
                {item.image && (
                    <div className="w-24 sm:w-32 shrink-0 bg-zinc-900 relative overflow-hidden">
                        <img
                            src={item.image}
                            alt="News Thumbnail"
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111]" />
                    </div>
                )}

                {/* Content */}
                <div className="p-4 flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[var(--color-neon-green)] uppercase tracking-wider">
                            {item.source}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                            {getTimeAgo(item.datetime)}
                        </span>
                    </div>

                    <h3 className="text-white font-medium leading-snug line-clamp-2 mb-2 group-hover:text-[var(--color-neon-green)] transition-colors">
                        {item.headline}
                    </h3>

                    <p className="text-xs text-zinc-400 line-clamp-2">
                        {item.summary}
                    </p>
                </div>
            </div>
        </a>
    );
}

function getTimeAgo(timestamp: number) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
}
