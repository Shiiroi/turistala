// useUserStorageUsage.ts — React Query hook for journal storage quota.
// Fetches the authenticated user's consumed storage bytes for journal photos to drive quota warnings

import { useQuery } from "@tanstack/react-query";
import { fetchUserStorageUsage } from "../services/journalApi";

export function useUserStorageUsage(userId: string | undefined) {
    return useQuery({
        queryKey: ["storage-usage", userId],
        queryFn: () => fetchUserStorageUsage(userId!),
        enabled: Boolean(userId),
    });
}
