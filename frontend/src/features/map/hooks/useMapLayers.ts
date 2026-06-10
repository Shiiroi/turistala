import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProvinces, fetchMunicitiesMeta, fetchMunicitiesGeometry, fetchRegions } from "../services/mapApi";
import type { MapMode } from "../../homepage/types";
import type { ProvinceGeoJSON, MunicityGeoJSON, MunicityMeta, Region } from "../types";

interface UseMapLayersReturn {
    provinces: ProvinceGeoJSON[];
    municities: MunicityGeoJSON[];
    municityMeta: MunicityMeta[];
    regions: Region[];
    loading: boolean;
    municitiesLoading: boolean;
    municitiesLoadProgress: number | null;
    error: Error | null;
}

export function useMapLayers(mapMode: MapMode): UseMapLayersReturn {
    const [loadProgress, setLoadProgress] = useState<number | null>(null);

    const provincesQuery = useQuery<ProvinceGeoJSON[]>({
        queryKey: ["provinces"],
        queryFn: fetchProvinces,
        staleTime: 15 * 60 * 1000,
    });

    const regionsQuery = useQuery<Region[]>({
        queryKey: ["regions"],
        queryFn: fetchRegions,
        staleTime: 15 * 60 * 1000,
    });

    const mapLayersReady = regionsQuery.isSuccess && provincesQuery.isSuccess;

    const municityMetaQuery = useQuery<MunicityMeta[]>({
        queryKey: ["municities", "meta"],
        queryFn: fetchMunicitiesMeta,
        staleTime: 20 * 60 * 1000,
        enabled: mapLayersReady,
    });

    const municitiesGeometryQuery = useQuery<MunicityGeoJSON[]>({
        queryKey: ["municities", "geometry"],
        queryFn: () =>
            fetchMunicitiesGeometry((loaded) => {
                setLoadProgress(loaded);
            }),
        staleTime: 20 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        enabled: mapMode === "municipality",
        retry: 1,
    });

    const loading = provincesQuery.isLoading || regionsQuery.isLoading;

    const municitiesLoading = municitiesGeometryQuery.isFetching && !municitiesGeometryQuery.data;

    const municitiesLoadProgress =
        municitiesLoading && loadProgress != null ? loadProgress : null;

    const error =
        provincesQuery.error ??
        municityMetaQuery.error ??
        regionsQuery.error ??
        (mapMode === "municipality" ? municitiesGeometryQuery.error : null);

    return {
        provinces: provincesQuery.data ?? [],
        municities: municitiesGeometryQuery.data ?? [],
        municityMeta: municityMetaQuery.data ?? [],
        regions: regionsQuery.data ?? [],
        loading,
        municitiesLoading,
        municitiesLoadProgress,
        error: error as Error | null,
    };
}
