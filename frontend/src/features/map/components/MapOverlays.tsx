import { useState } from "react";
import { FaLayerGroup } from "react-icons/fa";
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
            <div className="map-tools-anchor">
                {!toolsOpen && (
                    <button
                        type="button"
                        className="map-tools-toggle"
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
            {municitiesLoading && (
                <div
                    className="map-overlay-card map-overlay-card--compact"
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 1000,
                        pointerEvents: "none",
                    }}
                >
                    Loading municipalities…
                    {municitiesLoadProgress != null && (
                        <span style={{ display: "block", fontSize: 12, marginTop: 4, opacity: 0.85 }}>
                            {municitiesLoadProgress} / 1642
                        </span>
                    )}
                </div>
            )}
        </>
    );
}
