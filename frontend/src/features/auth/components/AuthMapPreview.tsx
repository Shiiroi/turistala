// Map backdrop for auth screens with wave loading and region hover preview.

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "../../../lib/cn";
import type { Division } from "../../homepage/types";
import { HoverInfoCard } from "../../map/components/HoverInfoCard";
import { TravelMap } from "../../map/components/TravelMap";
import { AUTH_SEA_BG_CLASS } from "../constants/authSeaBackground";
import { fetchRegions } from "../../map/services/mapApi";
import { buildAuthPreviewHeatmapColors } from "../utils/authPreviewHeatmap";
import { AuthMapLoadingWaves } from "./AuthMapLoadingWaves";

 // Performs operations for noop in AuthMapPreview.tsx.
const noop = () => {};

export function AuthMapPreview() {
    const [hoveredDivision, setHoveredDivision] = useState<Division | null>(null);
    const [wavesVisible, setWavesVisible] = useState(true);
    const [wavesFading, setWavesFading] = useState(false);
    const [mapRevealed, setMapRevealed] = useState(false);

    const regionsQuery = useQuery({
        queryKey: ["regions"],
        queryFn: fetchRegions,
        staleTime: 15 * 60 * 1000,
    });

    const regions = useMemo(() => regionsQuery.data ?? [], [regionsQuery.data]);

    const isMapLoading =
        regionsQuery.isLoading || (regionsQuery.isFetching && regions.length === 0);

    const heatmapColors = useMemo(() => {
        if (regions.length === 0) return new Map<number, string>();
        return buildAuthPreviewHeatmapColors(regions.map((r) => r.id));
    }, [regions]);

    useEffect(() => {
        if (regions.length === 0) {
            setWavesVisible(true);
            setWavesFading(false);
            setMapRevealed(false);
            return;
        }

        setWavesFading(true);
        const revealTimer = window.setTimeout(() => {
            setWavesVisible(false);
            setMapRevealed(true);
        }, 400);

        return () => clearTimeout(revealTimer);
    }, [regions.length]);

    return (
        <div
            className={cn(
                "auth-map-panel relative h-full min-h-[280px] w-full lg:min-h-0",
                AUTH_SEA_BG_CLASS,
            )}
        >
            <div className={cn("pointer-events-none absolute inset-0 z-0", AUTH_SEA_BG_CLASS)} aria-hidden />

            {(isMapLoading || wavesVisible) && <AuthMapLoadingWaves fading={wavesFading} />}

            {regionsQuery.isError && regions.length === 0 && !isMapLoading && (
                <p className="absolute inset-x-0 bottom-8 z-10 text-center text-sm text-primary/60">
                    Map preview unavailable
                </p>
            )}

            {regions.length > 0 && (
                <div
                    className={cn(
                        "relative z-10 h-full w-full transition-opacity duration-[400ms] ease-out",
                        mapRevealed ? "opacity-100" : "opacity-0",
                    )}
                >
                    <TravelMap
                        regions={regions}
                        mode="region"
                        selectedDivision={null}
                        heatmapColors={heatmapColors}
                        goalMunicityIds={new Set()}
                        goalProvinceIds={new Set()}
                        goalRegionIds={new Set()}
                        onHover={setHoveredDivision}
                        onSelect={noop}
                        interactive={false}
                        hoverable={true}
                        showTiles={false}
                        fillContainer
                        authPreview
                    />
                    <HoverInfoCard hoveredDivision={hoveredDivision} />
                </div>
            )}
        </div>
    );
}
