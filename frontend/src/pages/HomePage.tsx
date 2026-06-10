import { useEffect, useMemo, useState } from "react";
import { TravelMap } from "../features/map/components/TravelMap";
import { MapOverlays } from "../features/map/components/MapOverlays";
import { SearchModal } from "../features/map/components/SearchModal";
import { useMapLayers } from "../features/map/hooks/useMapLayers";
import { HomePageLayout } from "../features/homepage/components/HomePageLayout";
import { DetailPanel } from "../features/homepage/components/DetailPanel";
import { municityToDivision, useMapSelection } from "../features/homepage/hooks/useMapSelection";
import { useTravelStore } from "../features/travel/hooks/useTravelStore";
import { useProgressHeatmapColors } from "../features/travel/hooks/useProgressHeatmapColors";
import { useMapAccentColor } from "../features/profile/hooks/useMapAccentColor";
import { getDefaultViewTab, type ExploreViewTab } from "../features/homepage/components/DivisionExploreSection";
import { DemoBanner, ImportDemoModal } from "../features/auth/components/ImportDemoModal";
import { useDemoImportPrompt } from "../features/auth/hooks/useDemoImportPrompt";
import { useAuthSession } from "../features/auth/hooks/useAuthSession";
import { cn } from "../lib/cn";

const mapOverlayCardClasses = cn(
    "rounded-[10px] border border-[rgba(200,190,175,0.55)] bg-[rgba(250,246,238,0.94)]",
    "px-3 py-2 text-primary shadow-[0_2px_10px_rgba(44,36,22,0.06)] backdrop-blur-[10px]",
);

export default function HomePage() {
    const { data: session } = useAuthSession();
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

    const travelStore = useTravelStore();
    const [searchOpen, setSearchOpen] = useState(false);
    const importPrompt = useDemoImportPrompt();
    const [sidebarExploreViewTab, setSidebarExploreViewTab] = useState<ExploreViewTab>("provinces");
    const [mapProgressBy, setMapProgressBy] = useState<ExploreViewTab>("provinces");
    const { mapAccentColor, onMapAccentColorChange } = useMapAccentColor();

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

    const { goalProvinceIds, goalRegionIds } = useMemo(() => {
        const provinceIds = new Set<number>();
        const regionIds = new Set<number>();

        for (const municityId of travelStore.goalMunicityIds) {
            const meta = municityMeta.find((m) => m.id === municityId);
            if (!meta?.province_id) continue;
            provinceIds.add(meta.province_id);
            const province = provinces.find((p) => p.id === meta.province_id);
            if (province?.region_id) {
                regionIds.add(province.region_id);
            }
        }

        return { goalProvinceIds: provinceIds, goalRegionIds: regionIds };
    }, [travelStore.goalMunicityIds, municityMeta, provinces]);

    useEffect(() => {
        if (!selectedDivision || selectedDivision.level !== "municipality") return;
        if (selectedDivision.geometry) return;
        const loaded = municities.find((m) => m.id === selectedDivision.id);
        if (loaded) selectDivision(municityToDivision(loaded));
    }, [selectedDivision, municities, selectDivision]);

    if (loading || travelStore.isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-parchment">
                <div className={cn(mapOverlayCardClasses, "px-8 py-4")}>
                    Loading Philippines map…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-parchment">
                <div className="rounded-lg bg-red-100 px-6 py-3 text-red-800">
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
                        {travelStore.isDemo && !session && <DemoBanner />}
                        <TravelMap
                            provinces={provinces}
                            regions={regions}
                            municities={municities}
                            mode={mapMode}
                            selectedDivision={selectedDivision}
                            heatmapColors={heatmapColors}
                            goalMunicityIds={travelStore.goalMunicityIds}
                            goalProvinceIds={goalProvinceIds}
                            goalRegionIds={goalRegionIds}
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
                            onMapAccentColorChange={onMapAccentColorChange}
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
            {importPrompt.userId && importPrompt.demoData && (
                <ImportDemoModal
                    isOpen={importPrompt.showImportModal}
                    userId={importPrompt.userId}
                    demoData={importPrompt.demoData}
                    onDone={importPrompt.complete}
                />
            )}
        </>
    );
}
