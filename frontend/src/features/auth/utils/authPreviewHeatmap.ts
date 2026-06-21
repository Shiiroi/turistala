// authPreviewHeatmap.ts — Sample heatmap colors for the auth map preview.

import {
    DEFAULT_MAP_ACCENT,
    buildHeatmapPalette,
    getHeatmapColorFromRatio,
} from "../../travel/hooks/useMockHeatmapData";

// Sample region progress for auth preview (id → 0–1 ratio)
const SAMPLE_REGION_PROGRESS: Record<number, number> = {
    1: 0.92, // NCR
    3: 0.55, // Ilocos
    5: 0.48, // Central Luzon
    6: 0.78, // CALABARZON
    9: 0.35, // Western Visayas
    11: 0.62, // Central Visayas
    15: 0.28, // Davao
};

// Maps each region id to a heatmap color using baked sample progress ratios.
export function buildAuthPreviewHeatmapColors(regionIds: number[]): Map<number, string> {
    const palette = buildHeatmapPalette(DEFAULT_MAP_ACCENT);
    const colors = new Map<number, string>();

    for (const id of regionIds) {
        const ratio = SAMPLE_REGION_PROGRESS[id] ?? 0.08;
        colors.set(id, getHeatmapColorFromRatio(ratio, palette));
    }

    return colors;
}
