// Hook for accessing the global toast notification API.

import { useCallback, useContext } from "react";
import { ToastContext } from "./toastContext";

export type { ToastState, ToastVariant } from "./toastContext";

 /**
  * Accesses the global toast notifications context.
  * @returns The ToastContextValue object containing toast states and notification dispatcher handlers.
  * @throws Error if accessed outside an active ToastProvider wrapper hierarchy.
 */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return ctx;
}

/**
 * deprecated: use useToast().success()
 * Triggers a success notification specifying local or remote persistence completion.
 * @returns A memorized callback taking boolean 'isDemo' to dispatch appropriate toast message strings.
*/
export function useSaveFeedback() {
    const { success } = useToast();
    return useCallback(
        (isDemo: boolean) => {
            success(isDemo ? "Saved locally" : "Saved to your account");
        },
        [success],
    );
}
