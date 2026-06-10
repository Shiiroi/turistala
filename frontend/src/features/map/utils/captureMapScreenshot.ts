import html2canvas from "html2canvas";
import type L from "leaflet";

function waitFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function captureMapScreenshot(map: L.Map): Promise<string> {
    const container = map.getContainer();
    const controls = container.querySelector<HTMLElement>(".leaflet-control-container");

    const prevVisibility = controls?.style.visibility;
    if (controls) controls.style.visibility = "hidden";

    await waitFrame();

    try {
        const canvas = await html2canvas(container, {
            useCORS: true,
            allowTaint: false,
            scale: 2,
            logging: false,
            backgroundColor: null,
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

export function mapScreenshotFilename(date = new Date()): string {
    const iso = date.toISOString().slice(0, 10);
    return `turistala-map-${iso}.png`;
}

export function downloadDataUrlPng(dataUrl: string, filename: string): void {
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = filename;
    anchor.click();
}
