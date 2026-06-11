import { useContext, useEffect } from "react";
import { useMap } from "react-leaflet";
import { captureMapScreenshot } from "../utils/captureMapScreenshot";
import { MapScreenshotContext } from "./mapScreenshotContext";

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
