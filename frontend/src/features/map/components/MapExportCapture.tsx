import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type L from "leaflet";
import { captureExportMapPng } from "../utils/captureMapScreenshot";

export interface MapExportCaptureProps {
    bounds: L.LatLngBounds | null;
    captureScale: number;
    onComplete: (dataUrl: string) => void;
    onError: (error: Error) => void;
    onBeforeCapture?: () => void;
}

export function MapExportCapture({
    bounds,
    captureScale,
    onComplete,
    onError,
    onBeforeCapture,
}: MapExportCaptureProps) {
    const map = useMap();

    useEffect(() => {
        if (!bounds) return;

        let cancelled = false;
        let captureStarted = false;

        const runCapture = async () => {
            if (cancelled || captureStarted) return;
            captureStarted = true;
            try {
                const dataUrl = await captureExportMapPng(map, captureScale, bounds);
                if (!cancelled) onComplete(dataUrl);
            } catch (err) {
                if (!cancelled) {
                    onError(err instanceof Error ? err : new Error("Capture failed"));
                }
            }
        };

        const start = () => {
            if (cancelled) return;
            map.setMinZoom(1);
            map.setMaxZoom(18);
            map.invalidateSize(true);

            const afterFrame = () => {
                onBeforeCapture?.();
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        void runCapture();
                    });
                });
            };

            const onSettled = () => {
                if (cancelled) return;
                afterFrame();
            };

            map.once("moveend", onSettled);
            map.fitBounds(bounds, { padding: [8, 8], maxZoom: 18, animate: false });
        };

        map.whenReady(start);

        return () => {
            cancelled = true;
        };
    }, [bounds, captureScale, map, onComplete, onError, onBeforeCapture]);

    return null;
}
