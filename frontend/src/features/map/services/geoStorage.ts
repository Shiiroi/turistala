import { supabase } from "../../../config/supabase";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON, Region } from "../types";

const GEO_BUCKET = "geo";

export function getGeoStoragePublicUrl(fileName: string): string {
    const { data } = supabase.storage.from(GEO_BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
}

// Map layer JSON from Supabase Storage CDN
export async function fetchGeoLayerFromStorage<T>(fileName: string, label: string): Promise<T> {
    const url = getGeoStoragePublicUrl(fileName);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Storage ${label} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
}

export async function fetchRegionsFromStorage(): Promise<Region[]> {
    return fetchGeoLayerFromStorage<Region[]>("regions.json", "fetchRegions");
}

export async function fetchProvincesFromStorage(): Promise<ProvinceGeoJSON[]> {
    return fetchGeoLayerFromStorage<ProvinceGeoJSON[]>("provinces.json", "fetchProvinces");
}

export async function fetchMunicitiesMetaFromStorage(): Promise<MunicityMeta[]> {
    return fetchGeoLayerFromStorage<MunicityMeta[]>("municities/meta.json", "fetchMunicitiesMeta");
}

// All municity geometries — one file per province, parallel CDN fetches
export async function fetchMunicitiesGeometryFromStorage(): Promise<MunicityGeoJSON[]> {
    const manifest = await fetchGeoLayerFromStorage<{ provinceIds: number[] }>(
        "municities/manifest.json",
        "fetchMunicitiesManifest",
    );

    const batches = await Promise.all(
        manifest.provinceIds.map((provinceId) =>
            fetchGeoLayerFromStorage<MunicityGeoJSON[]>(
                `municities/province-${provinceId}.json`,
                `fetchMunicitiesProvince-${provinceId}`,
            ),
        ),
    );

    return batches.flat();
}
