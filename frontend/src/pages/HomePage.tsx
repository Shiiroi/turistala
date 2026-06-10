import { useEffect, useMemo, useState } from "react";
import { TravelMap } from "../features/map/components/TravelMap";
import { MapOverlays } from "../features/map/components/MapOverlays";
import { MapScreenshotModal } from "../features/map/components/MapScreenshotModal";
import { SearchModal } from "../features/map/components/SearchModal";
import { MapScreenshotProvider, useMapScreenshotCapture } from "../features/map/hooks/useMapScreenshot";
import { useMapLayers } from "../features/map/hooks/useMapLayers";
import { HomePageLayout } from "../features/homepage/components/HomePageLayout";
import { DetailPanel } from "../features/homepage/components/DetailPanel";
import { municityToDivision, useMapSelection } from "../features/homepage/hooks/useMapSelection";
import type { Division, MapMode } from "../features/homepage/types";
import { divisionLevelLabel } from "../features/homepage/types";
import { useTravelStore } from "../features/travel/hooks/useTravelStore";
import { useProgressHeatmapColors } from "../features/travel/hooks/useProgressHeatmapColors";
import { useMapAccentColor } from "../features/profile/hooks/useMapAccentColor";
import { getDefaultViewTab, type ExploreViewTab } from "../features/homepage/components/DivisionExploreSection";
import { DemoBanner, ImportDemoModal } from "../features/auth/components/ImportDemoModal";
import { useDemoImportPrompt } from "../features/auth/hooks/useDemoImportPrompt";
import { useAuthSession } from "../features/auth/hooks/useAuthSession";
import { useToast } from "../hooks/useToast";
import { cn } from "../lib/cn";

const mapOverlayCardClasses = cn(
    "rounded-[10px] border border-[rgba(200,190,175,0.55)] bg-[rgba(250,246,238,0.94)]",
    "px-3 py-2 text-primary shadow-[0_2px_10px_rgba(44,36,22,0.06)] backdrop-blur-[10px]",
);

const PROGRESS_BY_UNIT: Record<ExploreViewTab, string> = {
    provinces: "province",
    municipalities: "municipality",
    places: "place",
};

interface HomePageMapSectionProps {
    session: ReturnType<typeof useAuthSession>["data"];
    travelStore: ReturnType<typeof useTravelStore>;
    provinces: ReturnType<typeof useMapLayers>["provinces"];
    regions: ReturnType<typeof useMapLayers>["regions"];
    municities: ReturnType<typeof useMapLayers>["municities"];
    municityMeta: ReturnType<typeof useMapLayers>["municityMeta"];
    municitiesLoading: boolean;
    municitiesLoadProgress: number | null | undefined;
    mapMode: MapMode;
    selectedDivision: Division | null;
    hoveredDivision: Division | null;
    heatmapColors: Map<number, string>;
    goalProvinceIds: Set<number>;
    goalRegionIds: Set<number>;
    mapProgressBy: ExploreViewTab;
    mapAccentColor: string;
    onMapProgressByChange: (tab: ExploreViewTab) => void;
    onMapAccentColorChange: (color: string) => void;
    onModeChange: (mode: MapMode) => void;
    onSearchClick: () => void;
    onHover: (division: Division | null) => void;
    onSelect: (division: Division | null) => void;
    onViewOnMap: (division: Division, mode: MapMode) => void;
}

function HomePageMapSection({
    session,
    travelStore,
    provinces,
    regions,
    municities,
    municityMeta,
    municitiesLoading,
    municitiesLoadProgress,
    mapMode,
    selectedDivision,
    hoveredDivision,
    heatmapColors,
    goalProvinceIds,
    goalRegionIds,
    mapProgressBy,
    mapAccentColor,
    onMapProgressByChange,
    onMapAccentColorChange,
    onModeChange,
    onSearchClick,
    onHover,
    onSelect,
    onViewOnMap,
}: HomePageMapSectionProps) {
    const captureScreenshot = useMapScreenshotCapture();
    const { error: toastError, success: toastSuccess } = useToast();
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const screenshotCaption = `${divisionLevelLabel(mapMode)} view · progress by ${PROGRESS_BY_UNIT[mapProgressBy]}`;

    async function handleScreenshot() {
        setIsCapturing(true);
        try {
            const dataUrl = await captureScreenshot();
            setScreenshotPreview(dataUrl);
        } catch {
            toastError("Could not capture map — try again");
        } finally {
            setIsCapturing(false);
        }
    }

    return (
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
                onHover={onHover}
                onSelect={onSelect}
            />
            <MapOverlays
                hoveredDivision={hoveredDivision}
                mapMode={mapMode}
                municitiesLoading={municitiesLoading}
                municitiesLoadProgress={municitiesLoadProgress}
                onModeChange={onModeChange}
                onSearchClick={onSearchClick}
                onScreenshotClick={handleScreenshot}
                isCapturing={isCapturing}
                mapProgressBy={mapProgressBy}
                onMapProgressByChange={onMapProgressByChange}
                mapAccentColor={mapAccentColor}
                onMapAccentColorChange={onMapAccentColorChange}
                travelStore={travelStore}
                regions={regions}
                provinces={provinces}
                municityMeta={municityMeta}
                onViewOnMap={onViewOnMap}
            />
            <MapScreenshotModal
                isOpen={screenshotPreview != null}
                imageUrl={screenshotPreview}
                caption={screenshotCaption}
                onClose={() => setScreenshotPreview(null)}
                onSaved={() => toastSuccess("Saved as PNG")}
            />
        </>
    );
}

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

    function handleViewOnMap(division: Division, mode: MapMode) {
        setMapMode(mode);
        selectDivision(division);
    }

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
                    <MapScreenshotProvider>
                        <HomePageMapSection
                            session={session}
                            travelStore={travelStore}
                            provinces={provinces}
                            regions={regions}
                            municities={municities}
                            municityMeta={municityMeta}
                            municitiesLoading={municitiesLoading}
                            municitiesLoadProgress={municitiesLoadProgress}
                            mapMode={mapMode}
                            selectedDivision={selectedDivision}
                            hoveredDivision={hoveredDivision}
                            heatmapColors={heatmapColors}
                            goalProvinceIds={goalProvinceIds}
                            goalRegionIds={goalRegionIds}
                            mapProgressBy={mapProgressBy}
                            mapAccentColor={mapAccentColor}
                            onMapProgressByChange={setMapProgressBy}
                            onMapAccentColorChange={onMapAccentColorChange}
                            onModeChange={setMapMode}
                            onSearchClick={() => setSearchOpen(true)}
                            onHover={hoverDivision}
                            onSelect={selectDivision}
                            onViewOnMap={handleViewOnMap}
                        />
                    </MapScreenshotProvider>
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
