import { ChevronDown } from "lucide-react";
import type { MapMode } from "../../homepage/types";
import {
    getAvailableViewTabs,
    type ExploreViewTab,
} from "../../homepage/components/DivisionExploreSection";
import { HeatmapLegend } from "./HeatmapLegend";
import { MapProgressOverlay } from "./MapProgressOverlay";
import { ViewModeControl } from "./ViewModeControl";

const PROGRESS_TAB_LABELS: Record<ExploreViewTab, string> = {
    provinces: "Provinces",
    municipalities: "Municipalities",
    places: "Places",
};

interface MapToolsPanelProps {
    mapMode: MapMode;
    municitiesLoading?: boolean;
    onModeChange: (mode: MapMode) => void;
    progressBy: ExploreViewTab;
    onProgressByChange: (tab: ExploreViewTab) => void;
    accentColor: string;
    onAccentColorChange: (color: string) => void;
    onClose: () => void;
}

export function MapToolsPanel({
    mapMode,
    municitiesLoading,
    onModeChange,
    progressBy,
    onProgressByChange,
    accentColor,
    onAccentColorChange,
    onClose,
}: MapToolsPanelProps) {
    const progressTabs = getAvailableViewTabs(mapMode);

    return (
        <div className="map-tools-panel">
            <div className="map-tools-panel__header">
                <span className="label-mono">Map tools</span>
                <button
                    type="button"
                    className="map-tools-panel__close"
                    onClick={onClose}
                    aria-label="Hide map tools"
                >
                    <ChevronDown size={16} />
                </button>
            </div>

            <div className="map-tools-section">
                <ViewModeControl
                    mode={mapMode}
                    municitiesLoading={municitiesLoading}
                    onModeChange={onModeChange}
                />
            </div>

            <div className="map-tools-divider" />

            <div className="map-tools-section">
                <MapProgressOverlay
                    progressBy={progressBy}
                    onProgressByChange={onProgressByChange}
                    tabs={progressTabs}
                    tabLabels={PROGRESS_TAB_LABELS}
                />
            </div>

            <div className="map-tools-divider" />

            <div className="map-tools-section">
                <HeatmapLegend
                    accentColor={accentColor}
                    onAccentColorChange={onAccentColorChange}
                />
            </div>
        </div>
    );
}
