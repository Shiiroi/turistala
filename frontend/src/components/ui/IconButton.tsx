import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface IconButtonProps {
    icon?: LucideIcon;
    iconNode?: ReactNode;
    label: string;
    onClick: () => void;
    size?: number;
}

export function IconButton({ icon: Icon, iconNode, label, onClick, size = 18 }: IconButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className="icon-button"
        >
            {iconNode ?? (Icon ? <Icon size={size} strokeWidth={2} /> : null)}
        </button>
    );
}
