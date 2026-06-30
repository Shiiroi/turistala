// Centered overlay dialog.

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

export type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZE_WIDTH: Record<ModalSize, string> = {
    sm: "min(400px, 92vw)",
    md: "min(480px, 92vw)",
    lg: "min(560px, 92vw)",
    xl: "min(640px, 92vw)",
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    subtitle?: string;
    size?: ModalSize;
    zIndex?: number;
    // deprecated: prefer size
    maxWidth?: number | string;
    minHeight?: number | string;
    className?: string;
}

export function Modal({
    isOpen,
    onClose,
    children,
    title,
    subtitle,
    size = "md",
    zIndex = 9999,
    maxWidth,
    minHeight,
    className,
}: ModalProps) {
    if (!isOpen) return null;

    const widthPx = typeof maxWidth === "number" ? maxWidth : undefined;
    const resolvedMaxWidth =
        typeof maxWidth === "string"
            ? maxWidth
            : widthPx != null
              ? `min(${widthPx}px, 92vw)`
              : SIZE_WIDTH[size];

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-[rgba(44,36,22,0.45)] p-4"
            style={{ zIndex }}
            onClick={onClose}
        >
            <div
                className={cn(
                    "max-h-[90vh] overflow-auto rounded-[14px] border border-border bg-parchment px-7 py-6 shadow-[var(--shadow-lg)]",
                    className,
                )}
                style={{
                    width: resolvedMaxWidth,
                    maxWidth: resolvedMaxWidth,
                    minHeight: minHeight != null ? minHeight : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="m-0 font-display text-[22px] font-semibold text-primary">{title}</h2>
                            {subtitle && (
                                <p className="mt-1.5 text-[13px] leading-snug text-muted">{subtitle}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            className="flex shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-1 text-muted hover:bg-border-light hover:text-primary"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X size={20} strokeWidth={2} />
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
