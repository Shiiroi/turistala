import { useCallback, useMemo, useState } from "react";
import type { MockGoal, MockJournal, MockPlace, MockVisited, PlaceStatus } from "../types";

function uid(): string {
    return crypto.randomUUID();
}

export function useMockTravelStore() {
    const [places, setPlaces] = useState<MockPlace[]>([]);
    const [goals, setGoals] = useState<MockGoal[]>([]);
    const [visited, setVisited] = useState<MockVisited[]>([]);
    const [journals, setJournals] = useState<MockJournal[]>([]);

    const findPlaceByOsmId = useCallback(
        (osm_id: string) => places.find((p) => p.osm_id === osm_id),
        [places],
    );

    const addPlace = useCallback(
        (place: Omit<MockPlace, "id">): MockPlace => {
            const existing = places.find((p) => p.osm_id === place.osm_id);
            if (existing) return existing;

            const newPlace: MockPlace = { ...place, id: uid() };
            console.log({
                action: "ADD_PLACE",
                osm_id: place.osm_id,
                name: place.name,
                municity_id: place.municity_id,
                lat: place.lat,
                lng: place.lng,
            });
            setPlaces((prev) => [...prev, newPlace]);
            return newPlace;
        },
        [places],
    );

    const addAsGoal = useCallback(
        (placeId: string) => {
            if (goals.some((g) => g.place_id === placeId && !g.is_visited)) {
                return;
            }
            if (visited.some((v) => v.place_id === placeId)) return;

            const goal: MockGoal = {
                id: uid(),
                place_id: placeId,
                is_visited: false,
                added_at: new Date().toISOString(),
            };
            console.log({ action: "ADD_GOAL", place_id: placeId });
            setGoals((prev) => [...prev, goal]);
        },
        [goals, visited],
    );

    const addAsVisited = useCallback(
        (placeId: string) => {
            if (visited.some((v) => v.place_id === placeId)) return;

            const entry: MockVisited = {
                id: uid(),
                place_id: placeId,
                visited_at: new Date().toISOString().slice(0, 10),
            };
            console.log({ action: "ADD_VISITED", place_id: placeId });
            setVisited((prev) => [...prev, entry]);
            setGoals((prev) => prev.filter((g) => g.place_id !== placeId));
        },
        [visited],
    );

    const markGoalVisited = useCallback(
        (goalId: string) => {
            const goal = goals.find((g) => g.id === goalId);
            if (!goal) return;

            console.log({ action: "MARK_GOAL_VISITED", goal_id: goalId, place_id: goal.place_id });
            setGoals((prev) => prev.filter((g) => g.id !== goalId));
            addAsVisited(goal.place_id);
        },
        [goals, addAsVisited],
    );

    const removeGoal = useCallback((goalId: string) => {
        console.log({ action: "REMOVE_GOAL", goal_id: goalId });
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
    }, []);

    const removeVisited = useCallback((visitedId: string) => {
        console.log({ action: "REMOVE_VISITED", visited_id: visitedId });
        setVisited((prev) => prev.filter((v) => v.id !== visitedId));
    }, []);

    const createJournal = useCallback(
        (data: {
            place_id: string;
            title: string;
            content: string;
            visit_date: string;
            photos: { preview_url: string }[];
        }) => {
            const journal: MockJournal = {
                id: uid(),
                place_id: data.place_id,
                title: data.title,
                content: data.content,
                visit_date: data.visit_date,
                photos: data.photos.map((p, i) => ({
                    id: uid(),
                    preview_url: p.preview_url,
                    display_order: i,
                })),
                created_at: new Date().toISOString(),
            };
            console.log({ action: "CREATE_JOURNAL", journal_id: journal.id, place_id: data.place_id });
            setJournals((prev) => [...prev, journal]);
            return journal;
        },
        [],
    );

    const updateJournal = useCallback(
        (
            journalId: string,
            data: Partial<Pick<MockJournal, "title" | "content" | "visit_date">> & {
                photos?: { preview_url: string }[];
            },
        ) => {
            console.log({ action: "UPDATE_JOURNAL", journal_id: journalId, ...data });
            setJournals((prev) =>
                prev.map((j) => {
                    if (j.id !== journalId) return j;
                    const { photos: photoInput, ...rest } = data;
                    const next: MockJournal = { ...j, ...rest };
                    if (photoInput) {
                        next.photos = photoInput.map((p, i) => ({
                            id: j.photos[i]?.id ?? uid(),
                            preview_url: p.preview_url,
                            display_order: i,
                        }));
                    }
                    return next;
                }),
            );
        },
        [],
    );

    const deleteJournal = useCallback((journalId: string) => {
        console.log({ action: "DELETE_JOURNAL", journal_id: journalId });
        setJournals((prev) => prev.filter((j) => j.id !== journalId));
    }, []);

    const getPlaceStatus = useCallback(
        (placeId: string): PlaceStatus | null => {
            if (visited.some((v) => v.place_id === placeId)) return "visited";
            if (goals.some((g) => g.place_id === placeId && !g.is_visited)) return "goal";
            return null;
        },
        [visited, goals],
    );

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

export type MockTravelStore = ReturnType<typeof useMockTravelStore>;
