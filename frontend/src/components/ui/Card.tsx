// Parchment-styled content container.
// Provides a bordered, shadowed surface for grouped form and panel content.

import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface CardProps {
    children: ReactNode;
    className?: string;
}

 // React component rendering Card.
export function Card({ children, className }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-border bg-parchment p-6 shadow-[var(--shadow)]",
                className,
            )}
        >
            {children}
        </div>
    );
}
