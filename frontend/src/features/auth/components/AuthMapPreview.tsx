import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TravelMap } from "../../map/components/TravelMap";
import { fetchRegions } from "../../map/services/mapApi";
import { buildAuthPreviewHeatmapColors } from "../utils/authPreviewHeatmap";

const noop = () => {};

export function AuthMapPreview() {
    const regionsQuery = useQuery({
        queryKey: ["regions"],
        queryFn: fetchRegions,
        staleTime: 15 * 60 * 1000,
    });

    const regions = regionsQuery.data ?? [];

    const heatmapColors = useMemo(() => {
        if (regions.length === 0) return new Map<number, string>();
        return buildAuthPreviewHeatmapColors(regions.map((r) => r.id));
    }, [regions]);

    return (
        <div className="relative h-full min-h-[280px] w-full lg:min-h-0">
            {regions.length > 0 ? (
                <TravelMap
                    regions={regions}
                    mode="region"
                    selectedDivision={null}
                    heatmapColors={heatmapColors}
                    goalMunicityIds={new Set()}
                    goalProvinceIds={new Set()}
                    goalRegionIds={new Set()}
                    onHover={noop}
                    onSelect={noop}
                    interactive={false}
                    showTiles={false}
                />
            ) : (
                <div className="h-full w-full bg-gradient-to-b from-[#c5dce8] via-[#b8cfd8] to-[#a8c4d4]" />
            )}
        </div>
    );
}
