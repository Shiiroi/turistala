import { useMemo } from "react";
import type { MapMode } from "../../homepage/types";

export const DEFAULT_MAP_ACCENT = "#c0622f";
const HEATMAP_BASE = "#ede3d2";

const DEFAULT_HEATMAP_COLORS = buildHeatmapPalette(DEFAULT_MAP_ACCENT);

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const normalized = hex.replace("#", "");
    const value =
        normalized.length === 3
            ? normalized
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : normalized;
    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
    };
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b]
        .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
        .join("")}`;
}

function mixColors(from: string, to: string, amount: number): string {
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    const t = Math.min(1, Math.max(0, amount));
    return rgbToHex(
        a.r + (b.r - a.r) * t,
        a.g + (b.g - a.g) * t,
        a.b + (b.b - a.b) * t,
    );
}

function darken(hex: string, amount: number): string {
    return mixColors(hex, "#000000", amount);
}

/** Build a 6-step heatmap ramp from unvisited cream to the chosen accent */
export function buildHeatmapPalette(accentHex: string): string[] {
    return [
        HEATMAP_BASE,
        mixColors(HEATMAP_BASE, accentHex, 0.25),
        mixColors(HEATMAP_BASE, accentHex, 0.5),
        mixColors(HEATMAP_BASE, accentHex, 0.75),
        accentHex,
        darken(accentHex, 0.35),
    ];
}

/** Deterministic mock visit counts based on entity id for visual demo */
function mockVisitCount(id: number, level: MapMode): number {
    const seed = id * (level === "region" ? 7 : level === "province" ? 3 : 1);
    return seed % 12;
}

export function getHeatmapColor(count: number, palette: string[] = DEFAULT_HEATMAP_COLORS): string {
    if (count === 0) return palette[0];
    const index = Math.min(Math.ceil(count / 2), palette.length - 1);
    return palette[index];
}

/** Map a 0–1 progress ratio to a heatmap color */
export function getHeatmapColorFromRatio(
    ratio: number,
    palette: string[] = DEFAULT_HEATMAP_COLORS,
): string {
    if (ratio <= 0) return palette[0];
    const index = Math.min(Math.ceil(ratio * (palette.length - 1)), palette.length - 1);
    return palette[index];
}

export function useMockHeatmapData(
    mode: MapMode,
    entityIds: number[],
): Map<number, { count: number; color: string }> {
    return useMemo(() => {
        const map = new Map<number, { count: number; color: string }>();
        for (const id of entityIds) {
            const count = mockVisitCount(id, mode);
            map.set(id, { count, color: getHeatmapColor(count) });
        }
        return map;
    }, [mode, entityIds]);
}

export { DEFAULT_HEATMAP_COLORS as HEATMAP_COLORS };
