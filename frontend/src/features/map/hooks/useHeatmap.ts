// React Query hook for fetching a user's visited places.

import { useQuery } from "@tanstack/react-query";
import { fetchUserVisited } from "../../travel/services/travelApi";
import type { VisitedPlace } from "../../travel/types";

 /**
  * React hook providing states and handlers for heatmap.
  * @param userId - Parameter representing userId.
  * @returns Value or promise returned by useHeatmap.
 */
export function useHeatmap(userId: string | undefined) {
    return useQuery<VisitedPlace[]>({
        queryKey: ["heatmap", userId],
        queryFn: () => fetchUserVisited(userId!),
        enabled: !!userId,
    });
}
