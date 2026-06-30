// Canvas and DOM utilities for map PNG capture and download.

import html2canvas from "html2canvas";
import type L from "leaflet";

 /**
  * Performs operations for waitFrame in captureMapScreenshot.ts.
  * @returns Value or promise returned by waitFrame.
 */
function waitFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

 /**
  * Performs operations for getLayerCanvas in captureMapScreenshot.ts.
  * @param map - Parameter representing map.
  * @returns Value or promise returned by getLayerCanvas.
 */
function getLayerCanvas(map: L.Map): HTMLCanvasElement | null {
    return map.getContainer().querySelector<HTMLCanvasElement>(".leaflet-overlay-pane canvas");
}

// Copy Leaflet canvas; optionally crop to bounds
export async function captureExportMapPng(
    map: L.Map,
    scale = 2,
    cropBounds?: L.LatLngBounds,
): Promise<string> {
    let layerCanvas = getLayerCanvas(map);

    if (!layerCanvas) {
        throw new Error("Export map canvas not ready — try again");
    }

    if (layerCanvas.width === 0 || layerCanvas.height === 0) {
        await waitFrame();
        layerCanvas = getLayerCanvas(map);
        if (!layerCanvas || layerCanvas.width === 0 || layerCanvas.height === 0) {
            throw new Error("Export map canvas is empty — try again");
        }
    }

    const container = map.getContainer();
    const cssW = container.clientWidth;
    const cssH = container.clientHeight;
    if (cssW === 0 || cssH === 0) {
        throw new Error("Export map has zero size");
    }

    const ratioX = layerCanvas.width / cssW;
    const ratioY = layerCanvas.height / cssH;

    let srcX = 0;
    let srcY = 0;
    let srcW = layerCanvas.width;
    let srcH = layerCanvas.height;

    if (cropBounds?.isValid()) {
        const nw = map.latLngToContainerPoint(cropBounds.getNorthWest());
        const se = map.latLngToContainerPoint(cropBounds.getSouthEast());
        const x1 = Math.max(0, Math.floor(Math.min(nw.x, se.x) * ratioX));
        const y1 = Math.max(0, Math.floor(Math.min(nw.y, se.y) * ratioY));
        const x2 = Math.min(layerCanvas.width, Math.ceil(Math.max(nw.x, se.x) * ratioX));
        const y2 = Math.min(layerCanvas.height, Math.ceil(Math.max(nw.y, se.y) * ratioY));
        srcX = x1;
        srcY = y1;
        srcW = Math.max(1, x2 - x1);
        srcH = Math.max(1, y2 - y1);
    }

    const cropCssW = srcW / ratioX;
    const cropCssH = srcH / ratioY;
    const outW = Math.max(1, Math.round(cropCssW * scale));
    const outH = Math.max(1, Math.round(cropCssH * scale));

    const output = document.createElement("canvas");
    output.width = outW;
    output.height = outH;
    const ctx = output.getContext("2d");
    if (!ctx) {
        throw new Error("Could not create export canvas");
    }

    ctx.fillStyle = "#faf6ee";
    ctx.fillRect(0, 0, outW, outH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(layerCanvas, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

    const dataUrl = output.toDataURL("image/png");
    if (!dataUrl || dataUrl === "data:,") {
        throw new Error("Export produced an empty image");
    }
    return dataUrl;
}

export async function captureMapScreenshot(
    map: L.Map,
    options?: { scale?: number },
): Promise<string> {
    const container = map.getContainer();
    const controls = container.querySelector<HTMLElement>(".leaflet-control-container");

    const prevVisibility = controls?.style.visibility;
    if (controls) controls.style.visibility = "hidden";

    await waitFrame();

    const scale = options?.scale ?? 2;

    try {
        const canvas = await html2canvas(container, {
            useCORS: true,
            allowTaint: false,
            scale,
            logging: false,
            backgroundColor: "#faf6ee",
        });

        const dataUrl = canvas.toDataURL("image/png");
        if (!dataUrl || dataUrl === "data:,") {
            throw new Error("Capture produced an empty image");
        }
        return dataUrl;
    } finally {
        if (controls) {
            controls.style.visibility = prevVisibility ?? "";
        }
    }
}

 /**
  * Performs operations for mapScreenshotFilename in captureMapScreenshot.ts.
  * @param date - Parameter representing date.
  * @returns Value or promise returned by mapScreenshotFilename.
 */
export function mapScreenshotFilename(date = new Date()): string {
    const iso = date.toISOString().slice(0, 10);
    return `turistala-map-${iso}.png`;
}

 /**
  * Performs operations for downloadDataUrlPng in captureMapScreenshot.ts.
  * @param dataUrl - Parameter representing dataUrl.
  * @param filename - Parameter representing filename.
  * @returns Value or promise returned by downloadDataUrlPng.
 */
export function downloadDataUrlPng(dataUrl: string, filename: string): void {
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = filename;
    anchor.click();
}
