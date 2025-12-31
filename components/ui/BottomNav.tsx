import { Home, LineChart, Globe, Newspaper, Settings } from "lucide-react";

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    return (
        <nav className="fixed bottom-0 w-full z-50 pb-6 pt-4 px-6 bg-black/80 backdrop-blur-xl border-t border-white/5">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <NavItem
                    icon={<Home size={24} />}
                    label="Home"
                    isActive={activeTab === 'home'}
                    onClick={() => onTabChange('home')}
                />
                <NavItem
                    icon={<LineChart size={24} />}
                    label="Portfolio"
                    isActive={activeTab === 'portfolio'}
                    onClick={() => onTabChange('portfolio')}
                />
                <NavItem
                    icon={<Globe size={24} />}
                    label="Markets"
                    isActive={activeTab === 'markets'}
                    onClick={() => onTabChange('markets')}
                />
                <NavItem
                    icon={<Newspaper size={24} />}
                    label="News"
                    isActive={activeTab === 'news'}
                    onClick={() => onTabChange('news')}
                />
                <NavItem
                    icon={<Settings size={24} />}
                    label="Settings"
                    isActive={activeTab === 'settings'}
                    onClick={() => onTabChange('settings')}
                />
            </div>
        </nav>
    );
}

function NavItem({ icon, label, isActive = false, onClick }: { icon: React.ReactNode; label: string; isActive?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-[var(--color-neon-green)]" : "text-zinc-500 hover:text-zinc-300"}`}
        >
            <div className={`transition-all duration-300 ${isActive ? "drop-shadow-[0_0_8px_rgba(57,255,20,0.5)] scale-110" : "scale-100"}`}>
                {icon}
            </div>
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
            {isActive && (
                <div className="h-1 w-8 bg-[var(--color-neon-green)] rounded-full mt-2 absolute -bottom-6 shadow-[0_0_10px_var(--color-neon-green)] animate-in fade-in zoom-in duration-300" />
            )}
        </button>
    );
}
