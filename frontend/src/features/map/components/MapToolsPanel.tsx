// Collapsible panel for map view mode, progress metric, and heatmap.

import { ChevronDown } from "lucide-react";
import { CloseButton } from "../../../components/ui/CloseButton";
import { Label } from "../../../components/ui/Label";
import { cn } from "../../../lib/cn";
import type { MapMode } from "../../homepage/types";
import {
    getAvailableViewTabs,
    type ExploreViewTab,
} from "../../homepage/components/divisionExploreUtils";
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
        <div
            className={cn(
                "min-w-[240px] rounded-xl border border-[rgba(200,190,175,0.55)] bg-[rgba(250,246,238,0.94)] px-3.5 py-3",
                "shadow-[0_2px_12px_rgba(44,36,22,0.08)] backdrop-blur-[10px]",
            )}
        >
            <div className="mb-2.5 flex items-center justify-between">
                <Label as="span">Map tools</Label>
                <CloseButton onClick={onClose} ariaLabel="Hide map tools">
                    <ChevronDown size={16} />
                </CloseButton>
            </div>

            <div className="py-1">
                <ViewModeControl
                    mode={mapMode}
                    municitiesLoading={municitiesLoading}
                    onModeChange={onModeChange}
                />
            </div>

            <div className="my-2 h-px bg-[rgba(200,190,175,0.45)]" />

            <div className="py-1">
                <MapProgressOverlay
                    progressBy={progressBy}
                    onProgressByChange={onProgressByChange}
                    tabs={progressTabs}
                    tabLabels={PROGRESS_TAB_LABELS}
                />
            </div>

            <div className="my-2 h-px bg-[rgba(200,190,175,0.45)]" />

            <div className="py-1">
                <HeatmapLegend
                    accentColor={accentColor}
                    onAccentColorChange={onAccentColorChange}
                />
            </div>
        </div>
    );
}
