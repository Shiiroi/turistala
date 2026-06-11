import { createContext, type RefObject } from "react";

type CaptureFn = () => Promise<string>;

export interface MapScreenshotContextValue {
    captureRef: RefObject<CaptureFn | null>;
    registerCapture: (fn: CaptureFn | null) => void;
}

export const MapScreenshotContext = createContext<MapScreenshotContextValue | null>(null);
