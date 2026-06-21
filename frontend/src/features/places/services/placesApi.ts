// placesApi.ts — Supabase client for persisted place records.

import { supabase } from "../../../config/supabase";
import type { Place } from "../../travel/types";

export interface DbPlace {
    id: string;
    osm_id: string | null;
    name: string;
    category: string | null;
    municity_id: number;
    lat: number | null;
    lng: number | null;
}

function toPlace(row: DbPlace): Place {
    return {
        id: row.id,
        osm_id: row.osm_id ?? "",
        name: row.name,
        category: row.category ?? undefined,
        municity_id: row.municity_id,
        lat: row.lat ?? undefined,
        lng: row.lng ?? undefined,
    };
}

export async function fetchPlacesByIds(ids: string[]): Promise<Place[]> {
    if (ids.length === 0) return [];
    const { data, error } = await supabase.from("places").select("*").in("id", ids);
    if (error) throw error;
    return ((data ?? []) as DbPlace[]).map(toPlace);
}

export async function upsertPlaceByOsmId(
    place: Omit<Place, "id">,
): Promise<Place> {
    const { data: existing, error: findError } = await supabase
        .from("places")
        .select("*")
        .eq("osm_id", place.osm_id)
        .maybeSingle();

    if (findError) throw findError;
    if (existing) return toPlace(existing as DbPlace);

    const { data, error } = await supabase
        .from("places")
        .insert({
            osm_id: place.osm_id,
            name: place.name,
            category: place.category ?? null,
            municity_id: place.municity_id,
            lat: place.lat ?? null,
            lng: place.lng ?? null,
        })
        .select()
        .single();

    if (error) throw error;
    return toPlace(data as DbPlace);
}
