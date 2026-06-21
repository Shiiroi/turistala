// useAuthenticatedTravelStore.ts — Supabase-backed travel store for signed-in users.

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Goal, Journal, JournalPhotoInput, Place, TravelStore, VisitedPlace } from "../types";
import { upsertPlaceByOsmId } from "../../places/services/placesApi";
import {
    createGoal,
    createVisited,
    deleteGoal,
    deleteVisited,
    fetchUserGoals,
    fetchUserTravelPlaces,
    fetchUserVisited,
    importDemoTravelData,
    markGoalVisited,
} from "../services/travelApi";
import {
    createJournalEntry,
    deleteJournalEntry,
    deleteJournalPhoto,
    fetchJournalEntries,
    updateJournalEntry,
    uploadJournalPhoto,
} from "../../journal/services/journalApi";

interface TravelQueryData {
    places: Place[];
    goals: Goal[];
    visited: VisitedPlace[];
    journals: Journal[];
}

export function useAuthenticatedTravelStore(userId: string): TravelStore {
    const queryClient = useQueryClient();
    const travelQueryKey = useMemo(() => ["travel", userId] as const, [userId]);

    const patchTravelData = useCallback(
        (updater: (current: TravelQueryData) => TravelQueryData) => {
            queryClient.setQueryData<TravelQueryData>(travelQueryKey, (old) => {
                if (!old) return old;
                return updater(old);
            });
        },
        [queryClient, travelQueryKey],
    );

    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: travelQueryKey });
        queryClient.invalidateQueries({ queryKey: ["storage-usage", userId] });
    }, [queryClient, travelQueryKey, userId]);

    const { data, isLoading } = useQuery({
        queryKey: travelQueryKey,
        enabled: Boolean(userId),
        queryFn: async () => {
            const [places, goals, visited, journals] = await Promise.all([
                fetchUserTravelPlaces(userId),
                fetchUserGoals(userId),
                fetchUserVisited(userId),
                fetchJournalEntries(userId),
            ]);
            return { places, goals, visited, journals };
        },
    });

    const places = useMemo(() => data?.places ?? [], [data?.places]);
    const goals = useMemo(() => data?.goals ?? [], [data?.goals]);
    const visited = useMemo(() => data?.visited ?? [], [data?.visited]);
    const journals = useMemo(() => data?.journals ?? [], [data?.journals]);

    const findPlaceByOsmId = useCallback(
        (osm_id: string) => places.find((p) => p.osm_id === osm_id),
        [places],
    );

    const addPlace = useCallback(
        async (place: Omit<Place, "id">): Promise<Place> => {
            const saved = await upsertPlaceByOsmId(place);
            invalidate();
            return saved;
        },
        [invalidate],
    );

    const addAsGoal = useCallback(
        async (placeId: string) => {
            await createGoal(userId, placeId);
            invalidate();
        },
        [userId, invalidate],
    );

    const addAsVisited = useCallback(
        async (placeId: string) => {
            await createVisited(userId, placeId);
            invalidate();
        },
        [userId, invalidate],
    );

    const markGoalVisitedFn = useCallback(
        async (goalId: string) => {
            await markGoalVisited(userId, goalId);
            invalidate();
        },
        [userId, invalidate],
    );

    const removeGoal = useCallback(
        async (goalId: string) => {
            await deleteGoal(userId, goalId);
            invalidate();
        },
        [userId, invalidate],
    );

    const removeVisited = useCallback(
        async (visitedId: string) => {
            await deleteVisited(userId, visitedId);
            invalidate();
        },
        [userId, invalidate],
    );

    const uploadPhotos = useCallback(
        async (journalId: string, photos: JournalPhotoInput[]) => {
            const uploaded = [];
            let displayOrder = 0;
            for (const photo of photos) {
                if (photo.file) {
                    uploaded.push(
                        await uploadJournalPhoto(userId, journalId, photo.file, displayOrder),
                    );
                }
                displayOrder += 1;
            }
            return uploaded;
        },
        [userId],
    );

    const syncJournalPhotos = useCallback(
        async (journalId: string, photos: JournalPhotoInput[]) => {
            const existing = journals.find((j) => j.id === journalId);
            if (!existing) return;

            const keptIds = new Set(photos.filter((p) => p.id).map((p) => p.id!));
            for (const oldPhoto of existing.photos) {
                if (!keptIds.has(oldPhoto.id)) {
                    await deleteJournalPhoto(userId, oldPhoto.id);
                }
            }

            let displayOrder = 0;
            for (const photo of photos) {
                if (photo.file) {
                    await uploadJournalPhoto(userId, journalId, photo.file, displayOrder);
                }
                displayOrder += 1;
            }
        },
        [journals, userId],
    );

    const createJournal = useCallback(
        async (input: {
            place_id: string;
            title: string;
            content: string;
            visit_date: string;
            photos: JournalPhotoInput[];
        }): Promise<Journal> => {
            const journal = await createJournalEntry(userId, {
                place_id: input.place_id,
                title: input.title,
                content: input.content,
                visit_date: input.visit_date,
            });
            const uploadedPhotos = await uploadPhotos(journal.id, input.photos);
            const fullJournal = { ...journal, photos: uploadedPhotos };
            patchTravelData((current) => ({
                ...current,
                journals: [...current.journals, fullJournal],
            }));
            invalidate();
            return fullJournal;
        },
        [userId, invalidate, uploadPhotos, patchTravelData],
    );

    const updateJournal = useCallback(
        async (
            journalId: string,
            input: Partial<Pick<Journal, "title" | "content" | "visit_date">> & {
                photos?: JournalPhotoInput[];
            },
        ) => {
            const { photos, ...updates } = input;
            if (Object.keys(updates).length > 0) {
                await updateJournalEntry(userId, journalId, updates);
            }
            if (photos) {
                await syncJournalPhotos(journalId, photos);
            }
            patchTravelData((current) => ({
                ...current,
                journals: current.journals.map((j) =>
                    j.id === journalId ? { ...j, ...updates } : j,
                ),
            }));
            invalidate();
        },
        [userId, invalidate, syncJournalPhotos, patchTravelData],
    );

    const deleteJournal = useCallback(
        async (journalId: string) => {
            await deleteJournalEntry(userId, journalId);
            patchTravelData((current) => ({
                ...current,
                journals: current.journals.filter((j) => j.id !== journalId),
            }));
            invalidate();
        },
        [userId, invalidate, patchTravelData],
    );

    const getPlaceStatus = useCallback(
        (placeId: string) => {
            if (visited.some((v) => v.place_id === placeId)) return "visited" as const;
            if (goals.some((g) => g.place_id === placeId && !g.is_visited)) return "goal" as const;
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
        isDemo: false,
        isLoading,
        findPlaceByOsmId,
        addPlace,
        addAsGoal,
        addAsVisited,
        markGoalVisited: markGoalVisitedFn,
        removeGoal,
        removeVisited,
        createJournal,
        updateJournal,
        deleteJournal,
        getPlaceStatus,
    };
}

export function useImportDemoMutation(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (demo: import("../types").DemoTravelData) => {
            await importDemoTravelData(userId, demo);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["travel", userId] });
        },
    });
}
