import { useCallback, useRef, useState } from "react";

export function useAsyncAction<T extends unknown[]>(
    action: (...args: T) => void | Promise<void>,
) {
    const [pending, setPending] = useState(false);
    const pendingRef = useRef(false);
    const actionRef = useRef(action);
    actionRef.current = action;

    const run = useCallback(async (...args: T) => {
        if (pendingRef.current) return;
        pendingRef.current = true;
        setPending(true);
        try {
            await actionRef.current(...args);
        } finally {
            pendingRef.current = false;
            setPending(false);
        }
    }, []);

    return { run, pending };
}
