// mapApi.ts — Public API for loading map layers from storage or Supabase.

import { supabase } from "../../../config/supabase";
import type { ProvinceGeoJSON, MunicityGeoJSON, MunicityMeta, Region } from "../types";
import {
    fetchGeoLayerFromStorage,
    fetchMunicitiesGeometryFromStorage,
    fetchMunicitiesMetaFromStorage,
    fetchProvincesFromStorage,
    fetchRegionsFromStorage,
} from "./geoStorage";

export async function fetchRegions(): Promise<Region[]> {
    return fetchRegionsFromStorage();
}

export async function fetchProvinces(): Promise<ProvinceGeoJSON[]> {
    return fetchProvincesFromStorage();
}

// Metadata only (no geometry); Storage first, PostgREST fallback
export async function fetchMunicitiesMeta(): Promise<MunicityMeta[]> {
    try {
        return await fetchMunicitiesMetaFromStorage();
    } catch (storageErr) {
        console.warn("[fetchMunicitiesMeta] Storage failed, falling back to PostgREST:", storageErr);
        return fetchMunicitiesMetaFromDb();
    }
}

async function fetchMunicitiesMetaFromDb(): Promise<MunicityMeta[]> {
    const BATCH_SIZE = 1000;
    const all: MunicityMeta[] = [];
    let from = 0;
    let chunk: MunicityMeta[];

    do {
        const { data, error } = await supabase
            .from("municities")
            .select("id, name, code, province_id, region_id, type")
            .range(from, from + BATCH_SIZE - 1)
            .order("name");
        if (error) throw error;
        chunk = (data ?? []) as MunicityMeta[];
        all.push(...chunk);
        from += BATCH_SIZE;
    } while (chunk.length === BATCH_SIZE);

    console.info(`[fetchMunicitiesMeta] Loaded ${all.length} municities`);
    return all;
}

export async function fetchMunicitiesMetaByProvince(provinceId: number): Promise<MunicityMeta[]> {
    const { data, error } = await supabase
        .from("municities")
        .select("id, name, code, province_id, region_id, type")
        .eq("province_id", provinceId)
        .order("name");

    if (error) throw error;
    return (data ?? []) as MunicityMeta[];
}

// Full municity geometry from Storage CDN
export async function fetchMunicitiesGeometry(
    onProgress?: (loaded: number, total?: number) => void,
): Promise<MunicityGeoJSON[]> {
    const all = await fetchMunicitiesGeometryFromStorage();
    onProgress?.(all.length);
    return all;
}

export async function fetchMunicityById(id: number): Promise<MunicityGeoJSON | null> {
    const metaList = await fetchMunicitiesMetaFromStorage();
    const meta = metaList.find((m) => m.id === id);
    if (!meta?.province_id) return null;

    const provinceRows = await fetchGeoLayerFromStorage<MunicityGeoJSON[]>(
        `municities/province-${meta.province_id}.json`,
        `fetchMunicityById-${id}`,
    );
    return provinceRows.find((m) => m.id === id) ?? null;
}

export async function fetchProvincesByRegion(regionId: number): Promise<ProvinceGeoJSON[]> {
    const provinces = await fetchProvincesFromStorage();
    return provinces.filter((p) => p.region_id === regionId);
}

export async function fetchMunicitiesByProvince(provinceId: number): Promise<MunicityGeoJSON[]> {
    return fetchGeoLayerFromStorage<MunicityGeoJSON[]>(
        `municities/province-${provinceId}.json`,
        `fetchMunicitiesByProvince-${provinceId}`,
    );
}
