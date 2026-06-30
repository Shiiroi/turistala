// React Query hook for debounced place search.

import { useQuery } from "@tanstack/react-query";
import { searchPlaces, type PlaceSearchContext } from "../services/placeSearchApi";

 /**
  * React hook providing states and handlers for placesearch.
  * @param query - Parameter representing query.
  * @param context - Parameter representing context.
  * @returns Value or promise returned by usePlaceSearch.
 */
export function usePlaceSearch(query: string, context: PlaceSearchContext = {}) {
    const trimmed = query.trim();

    return useQuery({
        queryKey: [
            "place-search",
            trimmed,
            context.lat,
            context.lng,
            context.bbox,
            context.municityName,
            context.geometry?.type,
        ],
        queryFn: () => searchPlaces(trimmed, context),
        enabled: trimmed.length >= 2,
        staleTime: 60_000,
        retry: 1,
    });
}

export { getGeometryBounds } from "../../../lib/geoBounds";
