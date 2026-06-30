// Supabase queries and mutations for user travel records.

import { supabase } from "../../../config/supabase";
import type { Goal, Journal, Place, VisitedPlace } from "../types";
import { fetchPlacesByIds } from "../../places/services/placesApi";

interface DbGoal {
    id: string;
    user_id: string;
    place_id: string;
    added_at: string;
    is_visited: boolean;
    visited_at: string | null;
}

interface DbVisited {
    id: string;
    user_id: string;
    place_id: string;
    visited_at: string;
}

 /**
  * Performs operations for toGoal in travelApi.ts.
  * @param row - Parameter representing row.
  * @returns Value or promise returned by toGoal.
 */
function toGoal(row: DbGoal): Goal {
    return {
        id: row.id,
        place_id: row.place_id,
        is_visited: row.is_visited,
        visited_at: row.visited_at ?? undefined,
        added_at: row.added_at,
    };
}

 /**
  * Performs operations for toVisited in travelApi.ts.
  * @param row - Parameter representing row.
  * @returns Value or promise returned by toVisited.
 */
function toVisited(row: DbVisited): VisitedPlace {
    return {
        id: row.id,
        place_id: row.place_id,
        visited_at: row.visited_at,
    };
}

 /**
  * Retrieves the list of travel goals established by the user.
  * Ordered by creation date (newest first).
  * @param userId - The ID of the user.
  * @returns A promise resolving to an array of user goals.
 */
export async function fetchUserGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
        .from("user_place_goals")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as DbGoal[]).map(toGoal);
}

 /**
  * Retrieves the list of places the user has marked as visited.
  * Ordered by visit date in descending order.
  * @param userId - The ID of the user.
  * @returns A promise resolving to visited records.
 */
export async function fetchUserVisited(userId: string): Promise<VisitedPlace[]> {
    const { data, error } = await supabase
        .from("visited_places")
        .select("*")
        .eq("user_id", userId)
        .order("visited_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as DbVisited[]).map(toVisited);
}

 /**
  * Fetches all place records corresponding to the user's goals and visited collections.
  * Uses a single batch query for places matching the union of these place IDs.
  * @param userId - The ID of the user.
  * @returns A unique list of Place objects linked to user records.
 */
export async function fetchUserTravelPlaces(userId: string): Promise<Place[]> {
    const [goals, visited] = await Promise.all([
        fetchUserGoals(userId),
        fetchUserVisited(userId),
    ]);
    const placeIds = [...new Set([...goals.map((g) => g.place_id), ...visited.map((v) => v.place_id)])];
    return fetchPlacesByIds(placeIds);
}

 /**
  * Establishes a new travel goal target.
  * @param userId - The ID of the user.
  * @param placeId - The ID of the place target.
  * @returns The newly created Goal metadata.
 */
export async function createGoal(userId: string, placeId: string): Promise<Goal> {
    const { data, error } = await supabase
        .from("user_place_goals")
        .insert({ user_id: userId, place_id: placeId, is_visited: false })
        .select()
        .single();
    if (error) throw error;
    return toGoal(data as DbGoal);
}

 /**
  * Marks an existing goal as completed (visited).
  * @param userId - The ID of the user.
  * @param goalId - The ID of the goal to mark as completed.
 */
export async function markGoalVisited(userId: string, goalId: string): Promise<void> {
    const { error } = await supabase
        .from("user_place_goals")
        .update({ is_visited: true, visited_at: new Date().toISOString() })
        .eq("id", goalId)
        .eq("user_id", userId);
    if (error) throw error;
}

 /**
  * Removes a travel goal.
  * @param userId - The ID of the user.
  * @param goalId - The ID of the goal to remove.
 */
export async function deleteGoal(userId: string, goalId: string): Promise<void> {
    const { error } = await supabase
        .from("user_place_goals")
        .delete()
        .eq("id", goalId)
        .eq("user_id", userId);
    if (error) throw error;
}

 /**
  * Records a new visited place check-in.
  * @param userId - The ID of the user.
  * @param placeId - The ID of the place visited.
  * @returns The visited record metadata.
 */
export async function createVisited(userId: string, placeId: string): Promise<VisitedPlace> {
    const { data, error } = await supabase
        .from("visited_places")
        .insert({ user_id: userId, place_id: placeId })
        .select()
        .single();
    if (error) throw error;
    return toVisited(data as DbVisited);
}

 /**
  * Deletes a visited place record.
  * @param userId - The ID of the user.
  * @param visitedId - The ID of the visited place record.
 */
export async function deleteVisited(userId: string, visitedId: string): Promise<void> {
    const { error } = await supabase
        .from("visited_places")
        .delete()
        .eq("id", visitedId)
        .eq("user_id", userId);
    if (error) throw error;
}

 /**
  * Migrates a user's anonymous guest data (stored locally) into the remote database tables.
  * Loops through places, matches OSM IDs to prevent duplicates, creates relational mapping keys,
  * and bulk-inserts goals, visited records, and journals linked to the user's UUID.
  * @param userId - The ID of the authenticated user to link records to.
  * @param demo - The guest dataset containing places, goals, visited logs, and journals.
 */
export async function importDemoTravelData(
    userId: string,
    demo: {
        places: Place[];
        goals: Goal[];
        visited: VisitedPlace[];
        journals: Journal[];
    },
): Promise<void> {
    const osmToDbId = new Map<string, string>();

    for (const place of demo.places) {
        const { data: existing } = await supabase
            .from("places")
            .select("id")
            .eq("osm_id", place.osm_id)
            .maybeSingle();

        if (existing) {
            osmToDbId.set(place.id, existing.id);
            continue;
        }

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
            .select("id")
            .single();
        if (error) throw error;
        osmToDbId.set(place.id, data.id);
    }

    for (const goal of demo.goals.filter((g) => !g.is_visited)) {
        const placeId = osmToDbId.get(goal.place_id);
        if (!placeId) continue;
        await supabase.from("user_place_goals").upsert(
            { user_id: userId, place_id: placeId, is_visited: false },
            { onConflict: "user_id,place_id" },
        );
    }

    for (const v of demo.visited) {
        const placeId = osmToDbId.get(v.place_id);
        if (!placeId) continue;
        await supabase.from("visited_places").upsert(
            { user_id: userId, place_id: placeId, visited_at: v.visited_at },
            { onConflict: "user_id,place_id" },
        );
    }

    for (const journal of demo.journals) {
        const placeId = osmToDbId.get(journal.place_id);
        if (!placeId) continue;
        await supabase.from("journal_entries").insert({
            user_id: userId,
            place_id: placeId,
            title: journal.title,
            content: journal.content,
            visit_date: journal.visit_date,
        });
    }
}
