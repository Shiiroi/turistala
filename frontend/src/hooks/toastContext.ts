// toastContext.ts — React context types and provider state for toast notifications.

import { createContext } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastState {
    message: string;
    variant: ToastVariant;
}

export interface ToastContextValue {
    toast: ToastState | null;
    show: (message: string, variant: ToastVariant) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export const DISMISS_MS: Record<ToastVariant, number> = {
    success: 3000,
    error: 4000,
    info: 3000,
};
