// Hook that invokes the registered map screenshot capture.

import { useContext } from "react";
import { MapScreenshotContext } from "./mapScreenshotContext";

 /**
  * React hook providing states and handlers for mapscreenshotcapture.
  * @returns Value or promise returned by useMapScreenshotCapture.
 */
export function useMapScreenshotCapture() {
    const ctx = useContext(MapScreenshotContext);

    return async () => {
        const capture = ctx?.captureRef.current;
        if (!capture) {
            throw new Error("Map is not ready for screenshot");
        }
        return capture();
    };
}
