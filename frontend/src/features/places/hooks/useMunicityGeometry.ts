// React Query hook for municipality boundary data.
// Loads municipality GeoJSON by id from the map API to drive place search bounding boxes and

import { useQuery } from "@tanstack/react-query";
import { fetchMunicityById } from "../../map/services/mapApi";

 /**
  * React hook providing states and handlers for municitygeometry.
  * @param municityId - Parameter representing municityId.
  * @returns Value or promise returned by useMunicityGeometry.
 */
export function useMunicityGeometry(municityId: number | null) {
    return useQuery({
        queryKey: ["municity", "geometry", municityId],
        queryFn: () => fetchMunicityById(municityId!),
        enabled: municityId != null,
        staleTime: 30 * 60 * 1000,
    });
}
