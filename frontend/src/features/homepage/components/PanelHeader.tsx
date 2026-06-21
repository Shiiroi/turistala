// PanelHeader.tsx — Navigation header for nested panel views.

import { ChevronLeft, X } from "lucide-react";
import { CloseButton } from "../../../components/ui/CloseButton";
import { cn } from "../../../lib/cn";

interface PanelHeaderProps {
    onBack?: () => void;
    backLabel?: string;
    onClose: () => void;
    title?: string;
}

export function PanelHeader({ onBack, backLabel, onClose, title }: PanelHeaderProps) {
    return (
        <div className="mb-4 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-left font-body text-sm text-accent"
                    >
                        <ChevronLeft size={16} strokeWidth={2} />
                        {backLabel ?? "Back"}
                    </button>
                )}
                {title && !onBack && (
                    <div className="font-display text-lg font-semibold text-primary">{title}</div>
                )}
            </div>
            <CloseButton
                onClick={onClose}
                ariaLabel="Close panel"
                className={cn("hover:bg-border-light")}
            >
                <X size={20} strokeWidth={2} />
            </CloseButton>
        </div>
    );
}
