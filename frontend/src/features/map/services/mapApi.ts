import { supabase } from "../../../config/supabase";
import type { Geometry } from "geojson";
import type { ProvinceGeoJSON, MunicityGeoJSON, MunicityMeta, Region } from "../types";
import { fetchProvincesFromStorage, fetchRegionsFromStorage, fetchMunicitiesMetaFromStorage, fetchMunicitiesGeometryFromStorage } from "./geoStorage";

interface RawRegion {
    id: number;
    code: string;
    name: string;
    geojson: Geometry;
}

interface RawProvince {
    id: number;
    code: string;
    name: string;
    region_id: number;
    geojson: Geometry;
}

interface RawMunicity {
    id: number;
    name: string;
    code: string;
    province_id: number | null;
    region_id: number | null;
    type: "city" | "municipality";
    geojson: Geometry;
}

export async function fetchRegions(): Promise<Region[]> {
    try {
        return await fetchRegionsFromStorage();
    } catch (storageErr) {
        console.warn("[fetchRegions] Storage failed, falling back to PostgREST:", storageErr);
        return fetchRegionsFromDb();
    }
}

export async function fetchProvinces(): Promise<ProvinceGeoJSON[]> {
    try {
        return await fetchProvincesFromStorage();
    } catch (storageErr) {
        console.warn("[fetchProvinces] Storage failed, falling back to PostgREST:", storageErr);
        return fetchProvincesFromDb();
    }
}

async function fetchRegionsFromDb(): Promise<Region[]> {
    const { data, error } = await supabase.from("regions").select("id, code, name, geojson").order("id");
    if (error) throw error;
    const rows = (data ?? []) as RawRegion[];
    return rows.map((r) => ({ id: r.id, code: r.code, name: r.name, geometry: r.geojson })) as Region[];
}

async function fetchProvincesFromDb(): Promise<ProvinceGeoJSON[]> {
    const { data, error } = await supabase.from("provinces").select("id, code, name, region_id, geojson").order("name");
    if (error) throw error;
    const rows = (data ?? []) as RawProvince[];
    return rows.map((p) => ({ id: p.id, code: p.code, name: p.name, region_id: p.region_id, geometry: p.geojson })) as ProvinceGeoJSON[];
}

/** Quick metadata-only fetch (no geometry) — from Storage or PostgREST fallback */
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

/** Fetch full municipality geometry — Storage (parallel per-province) or PostgREST batches */
export async function fetchMunicitiesGeometry(
    onProgress?: (loaded: number, total?: number) => void,
): Promise<MunicityGeoJSON[]> {
    try {
        const all = await fetchMunicitiesGeometryFromStorage();
        onProgress?.(all.length);
        return all;
    } catch (storageErr) {
        console.warn("[fetchMunicitiesGeometry] Storage failed, falling back to PostgREST:", storageErr);
        return fetchMunicitiesGeometryFromDb(onProgress);
    }
}

async function fetchMunicitiesGeometryFromDb(
    onProgress?: (loaded: number, total?: number) => void,
): Promise<MunicityGeoJSON[]> {
    const BATCH_SIZE = 150;
    const all: MunicityGeoJSON[] = [];
    let from = 0;
    let chunk: RawMunicity[];

    do {
        const { data, error } = await supabase
            .from("municities")
            .select("id, name, code, province_id, region_id, type, geojson")
            .range(from, from + BATCH_SIZE - 1)
            .order("id");
        if (error) throw error;
        chunk = (data ?? []) as RawMunicity[];
        const mapped = chunk.map((m) => ({
            id: m.id,
            name: m.name,
            code: m.code,
            province_id: m.province_id,
            region_id: m.region_id,
            type: m.type,
            geometry: m.geojson,
        })) as MunicityGeoJSON[];
        all.push(...mapped);
        from += BATCH_SIZE;
        onProgress?.(all.length);
    } while (chunk.length === BATCH_SIZE);

    console.info(`[fetchMunicitiesGeometry] Loaded ${all.length} municities with geometry`);
    return all;
}

export async function fetchMunicityById(id: number): Promise<MunicityGeoJSON | null> {
    const { data, error } = await supabase
        .from("municities")
        .select("id, name, code, province_id, region_id, type, geojson")
        .eq("id", id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const m = data as RawMunicity;
    return {
        id: m.id,
        name: m.name,
        code: m.code,
        province_id: m.province_id,
        region_id: m.region_id,
        type: m.type,
        geometry: m.geojson,
    } as MunicityGeoJSON;
}

export async function fetchProvincesByRegion(regionId: number): Promise<ProvinceGeoJSON[]> {
    const { data, error } = await supabase.from("provinces").select("id, code, name, region_id, geojson").eq("region_id", regionId).order("name");

    if (error) throw error;
    return ((data ?? []) as RawProvince[]).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        region_id: p.region_id,
        geometry: p.geojson,
    })) as ProvinceGeoJSON[];
}

export async function fetchMunicitiesByProvince(provinceId: number): Promise<MunicityGeoJSON[]> {
    const { data, error } = await supabase
        .from("municities")
        .select("id, name, code, province_id, region_id, type, geojson")
        .eq("province_id", provinceId)
        .order("name");

    if (error) throw error;
    return ((data ?? []) as RawMunicity[]).map((m) => ({
        id: m.id,
        name: m.name,
        code: m.code,
        province_id: m.province_id,
        region_id: m.region_id,
        type: m.type,
        geometry: m.geojson,
    })) as MunicityGeoJSON[];
}
