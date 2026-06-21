// useJournalMutation.ts — React Query hooks for journal entry CRUD.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchJournalEntries,
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
} from "../services/journalApi";

export function useJournalEntries(userId: string | undefined) {
    return useQuery({
        queryKey: ["journal-entries", userId],
        queryFn: () => fetchJournalEntries(userId!),
        enabled: !!userId,
    });
}

export function useCreateJournalEntry(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (entry: {
            place_id: string;
            title: string;
            content: string;
            visit_date: string;
        }) => createJournalEntry(userId, entry),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["journal-entries", userId] });
            queryClient.invalidateQueries({ queryKey: ["travel", userId] });
        },
    });
}

export function useUpdateJournalEntry(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            updates,
        }: {
            id: string;
            updates: Partial<{ title: string; content: string; visit_date: string }>;
        }) => updateJournalEntry(userId, id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["journal-entries", userId] });
            queryClient.invalidateQueries({ queryKey: ["travel", userId] });
        },
    });
}

export function useDeleteJournalEntry(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteJournalEntry(userId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["journal-entries", userId] });
            queryClient.invalidateQueries({ queryKey: ["travel", userId] });
        },
    });
}
