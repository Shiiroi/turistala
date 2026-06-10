import { useEffect, useState } from "react";
import { TravelMap } from "../features/map/components/TravelMap";
import { MapOverlays } from "../features/map/components/MapOverlays";
import { SearchModal } from "../features/map/components/SearchModal";
import { useMapLayers } from "../features/map/hooks/useMapLayers";
import { HomePageLayout } from "../features/homepage/components/HomePageLayout";
import { DetailPanel } from "../features/homepage/components/DetailPanel";
import { municityToDivision, useMapSelection } from "../features/homepage/hooks/useMapSelection";
import { useMockTravelStore } from "../features/travel/hooks/useMockTravelStore";
import { useProgressHeatmapColors } from "../features/travel/hooks/useProgressHeatmapColors";
import { DEFAULT_MAP_ACCENT } from "../features/travel/hooks/useMockHeatmapData";
import { getDefaultViewTab, type ExploreViewTab } from "../features/homepage/components/DivisionExploreSection";

export default function HomePage() {
    const {
        hoveredDivision,
        selectedDivision,
        mapMode,
        setMapMode,
        selectDivision,
        hoverDivision,
    } = useMapSelection();

    const { provinces, municities, municityMeta, regions, loading, municitiesLoading, municitiesLoadProgress, error } =
        useMapLayers(mapMode);

    const travelStore = useMockTravelStore();
    const [searchOpen, setSearchOpen] = useState(false);
    const [sidebarExploreViewTab, setSidebarExploreViewTab] = useState<ExploreViewTab>("provinces");
    const [mapProgressBy, setMapProgressBy] = useState<ExploreViewTab>("provinces");
    const [mapAccentColor, setMapAccentColor] = useState(DEFAULT_MAP_ACCENT);

    useEffect(() => {
        if (selectedDivision) {
            setSidebarExploreViewTab(getDefaultViewTab(selectedDivision.level));
        }
    }, [selectedDivision?.id, selectedDivision?.level]);

    useEffect(() => {
        setMapProgressBy(getDefaultViewTab(mapMode));
    }, [mapMode]);

    const heatmapColors = useProgressHeatmapColors(
        mapMode,
        mapProgressBy,
        travelStore,
        regions,
        provinces,
        municityMeta,
        municities,
        mapAccentColor,
    );

    useEffect(() => {
        if (!selectedDivision || selectedDivision.level !== "municipality") return;
        if (selectedDivision.geometry) return;
        const loaded = municities.find((m) => m.id === selectedDivision.id);
        if (loaded) selectDivision(municityToDivision(loaded));
    }, [selectedDivision, municities, selectDivision]);

    if (loading) {
        return (
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-parchment)",
                }}
            >
                <div className="map-overlay-card" style={{ padding: "1rem 2rem" }}>
                    Loading Philippines map…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-parchment)",
                }}
            >
                <div
                    style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        padding: "0.75rem 1.5rem",
                        borderRadius: 8,
                    }}
                >
                    Failed to load map: {error.message}
                </div>
            </div>
        );
    }

    return (
        <>
            <HomePageLayout
                panelOpen={selectedDivision !== null}
                mapSection={
                    <>
                        <TravelMap
                            provinces={provinces}
                            regions={regions}
                            municities={municities}
                            mode={mapMode}
                            selectedDivision={selectedDivision}
                            heatmapColors={heatmapColors}
                            goalMunicityIds={travelStore.goalMunicityIds}
                            onHover={hoverDivision}
                            onSelect={selectDivision}
                        />
                        <MapOverlays
                            hoveredDivision={hoveredDivision}
                            mapMode={mapMode}
                            municitiesLoading={municitiesLoading}
                            municitiesLoadProgress={municitiesLoadProgress}
                            onModeChange={setMapMode}
                            onSearchClick={() => setSearchOpen(true)}
                            mapProgressBy={mapProgressBy}
                            onMapProgressByChange={setMapProgressBy}
                            mapAccentColor={mapAccentColor}
                            onMapAccentColorChange={setMapAccentColor}
                        />
                    </>
                }
                detailPanel={
                    <DetailPanel
                        selectedDivision={selectedDivision}
                        regions={regions}
                        provinces={provinces}
                        municities={municities}
                        municityMeta={municityMeta}
                        exploreViewTab={sidebarExploreViewTab}
                        onExploreViewTabChange={setSidebarExploreViewTab}
                        onSelectDivision={selectDivision}
                        onClose={() => selectDivision(null)}
                        travelStore={travelStore}
                    />
                }
            />
            <SearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                mapMode={mapMode}
                regions={regions}
                provinces={provinces}
                municities={municities}
                municityMeta={municityMeta}
                onSelect={selectDivision}
            />
        </>
    );
}
