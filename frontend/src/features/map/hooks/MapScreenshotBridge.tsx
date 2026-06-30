// Leaflet child that registers screenshot capture on the map.

import { useContext, useEffect } from "react";
import { useMap } from "react-leaflet";
import { captureMapScreenshot } from "../utils/captureMapScreenshot";
import { MapScreenshotContext } from "./mapScreenshotContext";

 // React component rendering MapScreenshotBridge.
export function MapScreenshotBridge() {
    const map = useMap();
    const ctx = useContext(MapScreenshotContext);

    useEffect(() => {
        if (!ctx) return;
        ctx.registerCapture(() => captureMapScreenshot(map));
        return () => {
            ctx.registerCapture(null);
        };
    }, [map, ctx]);

    return null;
}
