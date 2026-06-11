import { Label } from "../../../components/ui/Label";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { cn } from "../../../lib/cn";
import type { ExploreViewTab } from "../../homepage/components/divisionExploreUtils";

interface MapProgressOverlayProps {
    progressBy: ExploreViewTab;
    onProgressByChange: (tab: ExploreViewTab) => void;
    tabs: ExploreViewTab[];
    tabLabels: Record<ExploreViewTab, string>;
}

export function MapProgressOverlay({
    progressBy,
    onProgressByChange,
    tabs,
    tabLabels,
}: MapProgressOverlayProps) {
    return (
        <>
            <Label className={cn("mb-1.5")}>Color map by</Label>
            {tabs.length > 1 ? (
                <SegmentedControl
                    value={progressBy}
                    onChange={onProgressByChange}
                    options={tabs.map((tab) => ({
                        value: tab,
                        label: tabLabels[tab],
                    }))}
                />
            ) : (
                <div className="font-mono text-[11px] leading-snug text-muted">Places</div>
            )}
            <p className="mt-2 font-mono text-[11px] leading-snug text-muted">
                Heatmap reflects visited{" "}
                {progressBy === "provinces"
                    ? "provinces"
                    : progressBy === "municipalities"
                      ? "municipalities"
                      : "places"}{" "}
                at this zoom level.
            </p>
        </>
    );
}
