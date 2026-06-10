import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface LabelProps {
    children: ReactNode;
    className?: string;
    as?: "div" | "span" | "label";
}

export function Label({ children, className, as: Tag = "div" }: LabelProps) {
    return (
        <Tag
            className={cn(
                "font-mono text-[11px] uppercase tracking-[0.04em] text-muted",
                className,
            )}
        >
            {children}
        </Tag>
    );
}
