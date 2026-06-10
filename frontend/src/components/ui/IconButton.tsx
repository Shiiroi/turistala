import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

interface IconButtonProps {
    icon?: LucideIcon;
    iconNode?: ReactNode;
    label: string;
    onClick: () => void;
    size?: number;
    className?: string;
    disabled?: boolean;
}

export function IconButton({ icon: Icon, iconNode, label, onClick, size = 18, className, disabled = false }: IconButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            disabled={disabled}
            className={cn(
                "flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[rgba(200,190,175,0.55)]",
                "bg-[rgba(250,246,238,0.94)] text-muted shadow-[0_2px_8px_rgba(44,36,22,0.05)] backdrop-blur-[10px]",
                "transition-[background,border-color,color] duration-150",
                "hover:border-[rgba(192,98,47,0.45)] hover:bg-[rgba(255,252,247,0.98)] hover:text-accent",
                disabled && "pointer-events-none opacity-50",
                className,
            )}
        >
            {iconNode ?? (Icon ? <Icon size={size} strokeWidth={2} /> : null)}
        </button>
    );
}
