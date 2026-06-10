import { useMemo } from "react";
import type { MunicityMeta, ProvinceGeoJSON, Region } from "../../map/types";
import type { TravelStore } from "../../travel/types";
import type { PassportProgressLevel } from "../types";
import { computePassportStats } from "../utils/computePassportStats";
import type { ProvinceFilterOptions } from "../utils/provinceFilters";

export function usePassportStats(
    metric: PassportProgressLevel,
    store: TravelStore,
    regions: Region[],
    provinces: ProvinceGeoJSON[],
    municityMeta: MunicityMeta[],
    provinceFilter?: ProvinceFilterOptions,
) {
    return useMemo(
        () =>
            computePassportStats(
                metric,
                store,
                regions,
                provinces,
                municityMeta,
                provinceFilter,
            ),
        [
            metric,
            store,
            store.places,
            store.visited,
            store.goals,
            regions,
            provinces,
            municityMeta,
            provinceFilter?.includeMM,
            provinceFilter?.includeSGA,
        ],
    );
}
