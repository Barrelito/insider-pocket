export default function Sparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
    if (!data || data.length < 2) return null;

    // Normalize data to fit viewBox 100x30
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid divide by zero

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 30 - ((val - min) / range) * 30; // Invert Y (SVG 0 is top)
        return `${x},${y}`;
    }).join(" ");

    const color = isPositive ? "var(--color-neon-green)" : "var(--color-neon-red)";

    return (
        <div className="w-24 h-8 opacity-80">
            <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none" className="overflow-visible">
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}
