import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface MapOverlayCardProps {
    children: ReactNode;
    compact?: boolean;
    className?: string;
}

export function MapOverlayCard({ children, compact = false, className }: MapOverlayCardProps) {
    return (
        <div
            className={cn(
                "rounded-[10px] border border-[rgba(200,190,175,0.55)] bg-[rgba(250,246,238,0.94)] text-primary shadow-[0_2px_10px_rgba(44,36,22,0.06)] backdrop-blur-[10px]",
                compact ? "px-2.5 py-1.5 text-[13px]" : "px-3 py-2",
                className,
            )}
        >
            {children}
        </div>
    );
}
