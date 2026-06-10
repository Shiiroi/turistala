import { useState } from "react";
import { FaLayerGroup } from "react-icons/fa";
import { MapOverlayCard } from "../../../components/ui/MapOverlayCard";
import { cn } from "../../../lib/cn";
import type { Division, MapMode } from "../../homepage/types";
import type { ExploreViewTab } from "../../homepage/components/DivisionExploreSection";
import { HoverInfoCard } from "./HoverInfoCard";
import { MapToolbar } from "./MapToolbar";
import { MapToolsPanel } from "./MapToolsPanel";

interface MapOverlaysProps {
    hoveredDivision: Division | null;
    mapMode: MapMode;
    municitiesLoading?: boolean;
    municitiesLoadProgress?: number | null;
    onModeChange: (mode: MapMode) => void;
    onSearchClick: () => void;
    mapProgressBy: ExploreViewTab;
    onMapProgressByChange: (tab: ExploreViewTab) => void;
    mapAccentColor: string;
    onMapAccentColorChange: (color: string) => void;
}

export function MapOverlays({
    hoveredDivision,
    mapMode,
    municitiesLoading,
    municitiesLoadProgress,
    onModeChange,
    onSearchClick,
    mapProgressBy,
    onMapProgressByChange,
    mapAccentColor,
    onMapAccentColorChange,
}: MapOverlaysProps) {
    const [toolsOpen, setToolsOpen] = useState(false);

    return (
        <>
            <HoverInfoCard hoveredDivision={hoveredDivision} />
            <MapToolbar onSearchClick={onSearchClick} />
            <div
                className={cn(
                    "absolute bottom-4 left-4 z-[1000] flex flex-col-reverse items-start gap-2",
                )}
            >
                {!toolsOpen && (
                    <button
                        type="button"
                        className={cn(
                            "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(200,190,175,0.55)]",
                            "bg-[rgba(250,246,238,0.94)] px-3 py-2 font-mono text-xs text-muted shadow-[0_2px_10px_rgba(44,36,22,0.06)] backdrop-blur-[10px]",
                            "transition-[border-color,color,background] duration-150",
                            "hover:border-[rgba(192,98,47,0.45)] hover:bg-[rgba(255,252,247,0.98)] hover:text-accent",
                        )}
                        onClick={() => setToolsOpen(true)}
                        aria-expanded={false}
                        aria-label="Show map tools"
                    >
                        <FaLayerGroup size={14} />
                        <span>Map tools</span>
                    </button>
                )}
                {toolsOpen && (
                    <MapToolsPanel
                        mapMode={mapMode}
                        municitiesLoading={municitiesLoading}
                        onModeChange={onModeChange}
                        progressBy={mapProgressBy}
                        onProgressByChange={onMapProgressByChange}
                        accentColor={mapAccentColor}
                        onAccentColorChange={onMapAccentColorChange}
                        onClose={() => setToolsOpen(false)}
                    />
                )}
            </div>
            {mapMode === "municipality" && municitiesLoading && (
                <MapOverlayCard
                    compact
                    className="pointer-events-none absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2"
                >
                    Loading municipalities…
                    {municitiesLoadProgress != null && (
                        <span className="mt-1 block text-xs opacity-85">
                            {municitiesLoadProgress} / 1642
                        </span>
                    )}
                </MapOverlayCard>
            )}
        </>
    );
}
