// Toast.tsx — Global toast notification provider and viewport.

import { useCallback, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { DISMISS_MS, ToastContext, type ToastState, type ToastVariant } from "../../hooks/toastContext";
import { useToast } from "../../hooks/useToast";

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<ToastState | null>(null);

    const show = useCallback((message: string, variant: ToastVariant) => {
        setToast({ message, variant });
        window.setTimeout(() => {
            setToast((current) => (current?.message === message ? null : current));
        }, DISMISS_MS[variant]);
    }, []);

    const success = useCallback((message: string) => show(message, "success"), [show]);
    const error = useCallback((message: string) => show(message, "error"), [show]);
    const info = useCallback((message: string) => show(message, "info"), [show]);

    return (
        <ToastContext.Provider value={{ toast, show, success, error, info }}>
            {children}
        </ToastContext.Provider>
    );
}

export function ToastViewport() {
    const { toast } = useToast();
    if (!toast) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "pointer-events-none fixed bottom-4 left-1/2 z-[2000] -translate-x-1/2",
                "rounded-full border px-4 py-2 text-sm shadow-[var(--shadow-lg)]",
                toast.variant === "error"
                    ? "border-red-300 bg-red-50 text-red-800"
                    : toast.variant === "info"
                      ? "border-border bg-surface text-primary"
                      : "border-border bg-surface text-primary",
            )}
        >
            {toast.message}
        </div>
    );
}
