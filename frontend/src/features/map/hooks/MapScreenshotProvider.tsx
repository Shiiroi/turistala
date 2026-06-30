// Context provider for viewport map screenshot capture.

import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { MapScreenshotContext } from "./mapScreenshotContext";

type CaptureFn = () => Promise<string>;

 // React component rendering MapScreenshotProvider.
export function MapScreenshotProvider({ children }: { children: ReactNode }) {
    const captureRef = useRef<CaptureFn | null>(null);
    const registerCapture = useCallback((fn: CaptureFn | null) => {
        captureRef.current = fn;
    }, []);
    const value = useMemo(
        () => ({ captureRef, registerCapture }),
        [registerCapture],
    );

    return (
        <MapScreenshotContext.Provider value={value}>
            {children}
        </MapScreenshotContext.Provider>
    );
}
