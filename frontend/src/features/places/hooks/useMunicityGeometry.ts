import { useQuery } from "@tanstack/react-query";
import { fetchMunicityById } from "../../map/services/mapApi";

export function useMunicityGeometry(municityId: number | null) {
    return useQuery({
        queryKey: ["municity", "geometry", municityId],
        queryFn: () => fetchMunicityById(municityId!),
        enabled: municityId != null,
        staleTime: 30 * 60 * 1000,
    });
}
