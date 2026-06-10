import { useCallback, useMemo, useRef, useState } from "react";
import type { DemoTravelData, Goal, Journal, Place, TravelStore, VisitedPlace } from "../types";
import { loadDemoData, saveDemoData } from "../demoStorage";

function uid(): string {
    return crypto.randomUUID();
}

const EMPTY: DemoTravelData = { places: [], goals: [], visited: [], journals: [] };

export function useDemoTravelStore(): TravelStore {
    const dataRef = useRef<DemoTravelData>(loadDemoData());
    const [data, setData] = useState<DemoTravelData>(() => dataRef.current);
    const { places, goals, visited, journals } = data;

    const persist = useCallback((next: DemoTravelData) => {
        dataRef.current = next;
        saveDemoData(next);
        setData(next);
    }, []);

    const findPlaceByOsmId = useCallback(
        (osm_id: string) => dataRef.current.places.find((p) => p.osm_id === osm_id),
        [],
    );

    const addPlace = useCallback(
        (place: Omit<Place, "id">): Place => {
            const current = dataRef.current;
            const existing = current.places.find((p) => p.osm_id === place.osm_id);
            if (existing) return existing;
            const newPlace: Place = { ...place, id: uid() };
            persist({ ...current, places: [...current.places, newPlace] });
            return newPlace;
        },
        [persist],
    );

    const addAsGoal = useCallback(
        (placeId: string) => {
            const current = dataRef.current;
            if (current.goals.some((g) => g.place_id === placeId && !g.is_visited)) return;
            if (current.visited.some((v) => v.place_id === placeId)) return;
            const goal: Goal = {
                id: uid(),
                place_id: placeId,
                is_visited: false,
                added_at: new Date().toISOString(),
            };
            persist({ ...current, goals: [...current.goals, goal] });
        },
        [persist],
    );

    const addAsVisited = useCallback(
        (placeId: string) => {
            const current = dataRef.current;
            if (current.visited.some((v) => v.place_id === placeId)) return;
            const entry: VisitedPlace = {
                id: uid(),
                place_id: placeId,
                visited_at: new Date().toISOString().slice(0, 10),
            };
            persist({
                ...current,
                goals: current.goals.filter((g) => g.place_id !== placeId),
                visited: [...current.visited, entry],
            });
        },
        [persist],
    );

    const markGoalVisited = useCallback(
        (goalId: string) => {
            const current = dataRef.current;
            const goal = current.goals.find((g) => g.id === goalId);
            if (!goal) return;
            const entry: VisitedPlace = {
                id: uid(),
                place_id: goal.place_id,
                visited_at: new Date().toISOString().slice(0, 10),
            };
            persist({
                ...current,
                goals: current.goals.filter((g) => g.id !== goalId),
                visited: current.visited.some((v) => v.place_id === goal.place_id)
                    ? current.visited
                    : [...current.visited, entry],
            });
        },
        [persist],
    );

    const removeGoal = useCallback(
        (goalId: string) => {
            const current = dataRef.current;
            persist({ ...current, goals: current.goals.filter((g) => g.id !== goalId) });
        },
        [persist],
    );

    const removeVisited = useCallback(
        (visitedId: string) => {
            const current = dataRef.current;
            persist({ ...current, visited: current.visited.filter((v) => v.id !== visitedId) });
        },
        [persist],
    );

    const createJournal = useCallback(
        (input: {
            place_id: string;
            title: string;
            content: string;
            visit_date: string;
            photos: { preview_url: string }[];
        }): Journal => {
            for (const photo of input.photos) {
                if (photo.preview_url.startsWith("blob:")) {
                    URL.revokeObjectURL(photo.preview_url);
                }
            }
            const current = dataRef.current;
            const journal: Journal = {
                id: uid(),
                place_id: input.place_id,
                title: input.title,
                content: input.content,
                visit_date: input.visit_date,
                photos: [],
                created_at: new Date().toISOString(),
            };
            persist({ ...current, journals: [...current.journals, journal] });
            return journal;
        },
        [persist],
    );

    const updateJournal = useCallback(
        (
            journalId: string,
            input: Partial<Pick<Journal, "title" | "content" | "visit_date">> & {
                photos?: { preview_url: string }[];
            },
        ) => {
            const current = dataRef.current;
            const nextJournals = current.journals.map((j) => {
                if (j.id !== journalId) return j;
                const { photos: photoInput, ...rest } = input;
                const next: Journal = { ...j, ...rest };
                if (photoInput) {
                    for (const photo of photoInput) {
                        if (photo.preview_url.startsWith("blob:")) {
                            URL.revokeObjectURL(photo.preview_url);
                        }
                    }
                    next.photos = [];
                }
                return next;
            });
            persist({ ...current, journals: nextJournals });
        },
        [persist],
    );

    const deleteJournal = useCallback(
        (journalId: string) => {
            const current = dataRef.current;
            persist({ ...current, journals: current.journals.filter((j) => j.id !== journalId) });
        },
        [persist],
    );

    const getPlaceStatus = useCallback((placeId: string) => {
        const current = dataRef.current;
        if (current.visited.some((v) => v.place_id === placeId)) return "visited" as const;
        if (current.goals.some((g) => g.place_id === placeId && !g.is_visited)) return "goal" as const;
        return null;
    }, []);

    const goalMunicityIds = useMemo(() => {
        const ids = new Set<number>();
        for (const goal of goals.filter((g) => !g.is_visited)) {
            const place = places.find((p) => p.id === goal.place_id);
            if (place) ids.add(place.municity_id);
        }
        return ids;
    }, [goals, places]);

    return {
        places,
        goals,
        visited,
        journals,
        goalMunicityIds,
        isDemo: true,
        isLoading: false,
        findPlaceByOsmId,
        addPlace,
        addAsGoal,
        addAsVisited,
        markGoalVisited,
        removeGoal,
        removeVisited,
        createJournal,
        updateJournal,
        deleteJournal,
        getPlaceStatus,
    };
}

export function reloadDemoTravelStore(setData: (d: DemoTravelData) => void) {
    setData(loadDemoData());
}

export { EMPTY as emptyDemoData };
