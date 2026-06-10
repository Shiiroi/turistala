import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    type ReactNode,
    type RefObject,
} from "react";
import { useMap } from "react-leaflet";
import { captureMapScreenshot } from "../utils/captureMapScreenshot";

type CaptureFn = () => Promise<string>;

interface MapScreenshotContextValue {
    captureRef: RefObject<CaptureFn | null>;
}

const MapScreenshotContext = createContext<MapScreenshotContextValue | null>(null);

export function MapScreenshotProvider({ children }: { children: ReactNode }) {
    const captureRef = useRef<CaptureFn | null>(null);
    return (
        <MapScreenshotContext.Provider value={{ captureRef }}>
            {children}
        </MapScreenshotContext.Provider>
    );
}

export function MapScreenshotBridge() {
    const map = useMap();
    const ctx = useContext(MapScreenshotContext);

    useEffect(() => {
        if (!ctx) return;
        ctx.captureRef.current = () => captureMapScreenshot(map);
        return () => {
            ctx.captureRef.current = null;
        };
    }, [map, ctx]);

    return null;
}

export function useMapScreenshotCapture(): CaptureFn {
    const ctx = useContext(MapScreenshotContext);

    return useCallback(async () => {
        const capture = ctx?.captureRef.current;
        if (!capture) {
            throw new Error("Map is not ready for screenshot");
        }
        return capture();
    }, [ctx]);
}
