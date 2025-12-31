import { ExternalLink } from "lucide-react";

interface NewsItem {
    id: number;
    headline: string;
    summary: string;
    url: string;
    source: string;
    image: string;
    datetime: number;
    category: string;
}

export default function NewsFeed({ news }: { news: NewsItem[] }) {
    if (!news || news.length === 0) {
        return (
            <div className="text-center py-20 text-zinc-600">
                <p>No news available right now.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-24">
            {Array.isArray(news) && news.map((item) => (
                <a
                    key={item.id}
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
            ))}
        </div>
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
