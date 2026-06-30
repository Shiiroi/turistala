// Accessible dismiss control for panels and modals.
// Renders a transparent icon button with hover feedback and configurable size.

import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface CloseButtonProps {
    onClick: () => void;
    ariaLabel: string;
    children: ReactNode;
    className?: string;
    size?: "sm" | "md";
}

const sizeClasses = {
    sm: "size-7",
    md: "size-9 p-1",
};

export function CloseButton({
    onClick,
    ariaLabel,
    children,
    className,
    size = "sm",
}: CloseButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className={cn(
                "flex cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-muted transition-[background,color] duration-150",
                "hover:bg-[rgba(44,36,22,0.06)] hover:text-primary",
                sizeClasses[size],
                className,
            )}
        >
            {children}
        </button>
    );
}
