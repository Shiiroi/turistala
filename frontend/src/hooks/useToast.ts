import { useCallback, useContext } from "react";
import { ToastContext } from "./toastContext";

export type { ToastState, ToastVariant } from "./toastContext";

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return ctx;
}

/** @deprecated Use useToast().success() */
export function useSaveFeedback() {
    const { success } = useToast();
    return useCallback(
        (isDemo: boolean) => {
            success(isDemo ? "Saved locally" : "Saved to your account");
        },
        [success],
    );
}
