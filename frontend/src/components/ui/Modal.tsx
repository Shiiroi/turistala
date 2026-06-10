import type { ReactNode } from "react";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZE_WIDTH: Record<ModalSize, number> = {
    sm: 400,
    md: 480,
    lg: 560,
    xl: 640,
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    subtitle?: string;
    size?: ModalSize;
    /** @deprecated prefer size */
    maxWidth?: number | string;
    minHeight?: number | string;
}

export function Modal({
    isOpen,
    onClose,
    children,
    title,
    subtitle,
    size = "md",
    maxWidth,
    minHeight,
}: ModalProps) {
    if (!isOpen) return null;

    const widthPx =
        typeof maxWidth === "number" ? maxWidth : maxWidth ? undefined : SIZE_WIDTH[size];
    const resolvedMaxWidth =
        typeof maxWidth === "string"
            ? maxWidth
            : widthPx != null
              ? `min(${widthPx}px, 92vw)`
              : "92vw";

    return (
        <div
            className="modal-backdrop"
            onClick={onClose}
        >
            <div
                className="modal-panel"
                style={{
                    width: widthPx != null ? `min(${widthPx}px, 92vw)` : resolvedMaxWidth,
                    maxWidth: resolvedMaxWidth,
                    minHeight: minHeight != null ? minHeight : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="modal-header">
                        <div>
                            <h2 className="modal-title">{title}</h2>
                            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                        </div>
                        <button
                            type="button"
                            className="modal-close"
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
