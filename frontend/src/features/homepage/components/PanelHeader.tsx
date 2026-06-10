import { ChevronLeft, X } from "lucide-react";

interface PanelHeaderProps {
    onBack?: () => void;
    backLabel?: string;
    onClose: () => void;
    title?: string;
}

export function PanelHeader({ onBack, backLabel, onClose, title }: PanelHeaderProps) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                gap: 8,
            }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            fontFamily: "var(--font-body)",
                            fontSize: 14,
                            color: "var(--accent)",
                            textAlign: "left",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        <ChevronLeft size={16} strokeWidth={2} />
                        {backLabel ?? "Back"}
                    </button>
                )}
                {title && !onBack && (
                    <div
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 18,
                            fontWeight: 600,
                        }}
                    >
                        {title}
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="modal-close"
            >
                <X size={20} strokeWidth={2} />
            </button>
        </div>
    );
}
