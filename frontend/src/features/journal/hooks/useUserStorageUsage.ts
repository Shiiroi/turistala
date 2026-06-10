import { useQuery } from "@tanstack/react-query";
import { fetchUserStorageUsage } from "../services/journalApi";

export function useUserStorageUsage(userId: string | undefined) {
    return useQuery({
        queryKey: ["storage-usage", userId],
        queryFn: () => fetchUserStorageUsage(userId!),
        enabled: Boolean(userId),
    });
}
