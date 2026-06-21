// useHeatmap.ts — React Query hook for fetching a user's visited places.

import { useQuery } from "@tanstack/react-query";
import { fetchUserVisited } from "../../travel/services/travelApi";
import type { VisitedPlace } from "../../travel/types";

export function useHeatmap(userId: string | undefined) {
    return useQuery<VisitedPlace[]>({
        queryKey: ["heatmap", userId],
        queryFn: () => fetchUserVisited(userId!),
        enabled: !!userId,
    });
}
