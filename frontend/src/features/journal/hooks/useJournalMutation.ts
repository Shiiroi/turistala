// React Query hooks for journal entry CRUD.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchJournalEntries,
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
} from "../services/journalApi";

 /**
  * React hook providing states and handlers for journalentries.
  * @param userId - Parameter representing userId.
  * @returns Value or promise returned by useJournalEntries.
 */
export function useJournalEntries(userId: string | undefined) {
    return useQuery({
        queryKey: ["journal-entries", userId],
        queryFn: () => fetchJournalEntries(userId!),
        enabled: !!userId,
    });
}

 /**
  * React hook providing states and handlers for createjournalentry.
  * @param userId - Parameter representing userId.
  * @returns Value or promise returned by useCreateJournalEntry.
 */
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

 /**
  * React hook providing states and handlers for updatejournalentry.
  * @param userId - Parameter representing userId.
  * @returns Value or promise returned by useUpdateJournalEntry.
 */
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

 /**
  * React hook providing states and handlers for deletejournalentry.
  * @param userId - Parameter representing userId.
  * @returns Value or promise returned by useDeleteJournalEntry.
 */
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
