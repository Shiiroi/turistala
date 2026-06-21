// Badge.tsx — Compact status label component.
// Renders a small pill-shaped label for counts, tags, or visit indicators.

import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface BadgeProps {
    children: ReactNode;
    variant?: "default" | "visited";
    className?: string;
}

const variantClasses = {
    default: "bg-border-light text-muted",
    visited: "bg-accent/12 text-accent-dark",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-block rounded-full px-[7px] py-0.5 font-mono text-[10px]",
                variantClasses[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
