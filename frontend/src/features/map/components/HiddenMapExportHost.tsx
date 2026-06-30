// Off-screen renderer that produces scoped PNG map exports.

import { useEffect, useMemo, useState } from "react";
import type { MapMode } from "../../homepage/types";
import { useProgressHeatmapColors } from "../../travel/hooks/useProgressHeatmapColors";
import type { TravelStore } from "../../travel/types";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON, Region } from "../types";
import type { ExportPngJob, MapExportProgressBy } from "../types/mapExport";
import { boundsFromGeometries } from "../utils/boundsFromGeometries";
import { exportCaptureScale, exportMapDimensions } from "../utils/exportMapDimensions";
import { loadMunicitiesForExport } from "../utils/loadExportMunicities";
import { TravelMap } from "./TravelMap";

interface HiddenMapExportHostProps {
    job: ExportPngJob;
    regions: Region[];
    provinces: ProvinceGeoJSON[];
    municityMeta: MunicityMeta[];
    cachedMunicities: MunicityGeoJSON[];
    travelStore: TravelStore;
    accentColor: string;
    onComplete: (dataUrl: string) => void;
    onError: (error: Error) => void;
}

export function HiddenMapExportHost({
    job,
    regions,
    provinces,
    municityMeta,
    cachedMunicities,
    travelStore,
    accentColor,
    onComplete,
    onError,
}: HiddenMapExportHostProps) {
    const [exportMunicities, setExportMunicities] = useState<MunicityGeoJSON[] | null>(null);
    const entitySet = useMemo(() => new Set(job.entityIds), [job.entityIds]);

    const filteredRegions = useMemo(
        () => regions.filter((r) => entitySet.has(r.id)),
        [regions, entitySet],
    );
    const filteredProvinces = useMemo(
        () => provinces.filter((p) => entitySet.has(p.id)),
        [provinces, entitySet],
    );

    useEffect(() => {
        if (job.level !== "municipality") return;

        let cancelled = false;
        loadMunicitiesForExport(
            job.level,
            job.scope,
            job.entityIds,
            provinces,
            municityMeta,
            cachedMunicities,
        )
            .then((rows) => {
                if (!cancelled) setExportMunicities(rows);
            })
            .catch((err) => {
                if (!cancelled) {
                    onError(err instanceof Error ? err : new Error("Failed to load map geometry"));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [job, provinces, municityMeta, cachedMunicities, onError]);

    const municitiesForMap = useMemo(() => {
        if (job.level !== "municipality") return [];
        if (exportMunicities == null) return [];
        if (job.scope.kind === "all") return exportMunicities;
        return exportMunicities.filter((m) => entitySet.has(m.id));
    }, [job.level, job.scope.kind, exportMunicities, entitySet]);

    const mapRegions = job.level === "region" ? filteredRegions : [];
    const mapProvinces = job.level === "province" ? filteredProvinces : [];
    const mapMode: MapMode = job.level;
    const progressBy = job.progressBy as MapExportProgressBy;

    // Region exports need all provinces for progress ratios — entityIds are region ids only.
    const provincesForHeatmap =
        job.level === "region"
            ? provinces
            : mapProvinces.length > 0
              ? mapProvinces
              : filteredProvinces;

    const heatmapColors = useProgressHeatmapColors(
        mapMode,
        progressBy,
        travelStore,
        mapRegions.length > 0 ? mapRegions : filteredRegions,
        provincesForHeatmap,
        municityMeta,
        municitiesForMap,
        accentColor,
    );

    const bounds = useMemo(() => {
        const geometries =
            job.level === "region"
                ? filteredRegions.map((r) => r.geometry)
                : job.level === "province"
                  ? filteredProvinces.map((p) => p.geometry)
                  : municitiesForMap.map((m) => m.geometry);
        return boundsFromGeometries(geometries);
    }, [job.level, filteredRegions, filteredProvinces, municitiesForMap]);

    const exportSize = useMemo(
        () => (bounds ? exportMapDimensions(bounds) : { width: 1200, height: 800 }),
        [bounds],
    );
    const captureScale = useMemo(
        () => exportCaptureScale(exportSize.width, exportSize.height),
        [exportSize.width, exportSize.height],
    );

    const geometryReady = job.level !== "municipality" || exportMunicities != null;

    if (!geometryReady) {
        return null;
    }

    if (!bounds) {
        onError(new Error("No map geometry in export scope"));
        return null;
    }

    return (
        <div
            className="pointer-events-none fixed left-0 top-0 -z-[9999] opacity-0"
            style={{ width: exportSize.width, height: exportSize.height }}
        >
            <TravelMap
                regions={mapRegions}
                provinces={mapProvinces}
                municities={municitiesForMap}
                mode={mapMode}
                selectedDivision={null}
                heatmapColors={heatmapColors}
                goalMunicityIds={new Set()}
                goalProvinceIds={new Set()}
                goalRegionIds={new Set()}
                onHover={() => {}}
                onSelect={() => {}}
                interactive={false}
                showTiles={false}
                exportCapture={{ bounds, captureScale, onComplete, onError }}
            />
        </div>
    );
}
