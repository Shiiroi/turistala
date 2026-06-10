import type { ExploreViewTab } from "../../homepage/components/DivisionExploreSection";

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
            <div className="label-mono map-tools-section__label">Color map by</div>
            {tabs.length > 1 ? (
                <div className="segmented-control">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            className={progressBy === tab ? "active" : ""}
                            onClick={() => onProgressByChange(tab)}
                        >
                            {tabLabels[tab]}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="map-progress-hint">Places</div>
            )}
            <p className="map-progress-hint">
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
