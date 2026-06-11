// decorative passport header icons (live UI)

export function StylizedSunMark({ size = 64, className }: { size?: number; className?: string }) {
    const rays = Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const x1 = 32 + Math.cos(angle) * 10;
        const y1 = 32 + Math.sin(angle) * 10;
        const x2 = 32 + Math.cos(angle) * 28;
        const y2 = 32 + Math.sin(angle) * 28;
        return { x1, y1, x2, y2 };
    });

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            aria-hidden
            className={className}
        >
            {rays.map((ray, i) => (
                <line
                    key={i}
                    x1={ray.x1}
                    y1={ray.y1}
                    x2={ray.x2}
                    y2={ray.y2}
                    stroke="#c0622f"
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={0.22}
                />
            ))}
            <circle cx={32} cy={32} r={9} fill="#e9a319" opacity={0.28} />
            <circle cx={32} cy={32} r={5.5} fill="#c0622f" opacity={0.35} />
        </svg>
    );
}

export function PlaneMark({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none">
            <g transform="rotate(-45 12 12)">
                <path
                    d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                    fill="#c0622f"
                    fillOpacity={0.85}
                />
            </g>
        </svg>
    );
}
