import { Home, LineChart, Globe, Newspaper, Settings } from "lucide-react";

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 w-full z-50 pb-6 pt-4 px-6 bg-black/80 backdrop-blur-xl border-t border-white/5">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <NavItem icon={<Home size={24} />} label="Home" />
                <NavItem icon={<LineChart size={24} />} label="Portfolio" isActive />
                <NavItem icon={<Globe size={24} />} label="Markets" />
                <NavItem icon={<Newspaper size={24} />} label="News" />
                <NavItem icon={<Settings size={24} />} label="Settings" />
            </div>
        </nav>
    );
}

function NavItem({ icon, label, isActive = false }: { icon: React.ReactNode; label: string; isActive?: boolean }) {
    return (
        <div className={`flex flex-col items-center gap-1 ${isActive ? "text-[var(--color-neon-green)]" : "text-zinc-500"}`}>
            <div className={isActive ? "drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]" : ""}>
                {icon}
            </div>
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
            {isActive && (
                <div className="h-1 w-8 bg-[var(--color-neon-green)] rounded-full mt-2 absolute -bottom-6 shadow-[0_0_10px_var(--color-neon-green)]" />
            )}
        </div>
    );
}
