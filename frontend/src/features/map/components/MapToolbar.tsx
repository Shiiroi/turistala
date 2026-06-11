import { Camera, Search } from "lucide-react";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import { IconButton } from "../../../components/ui/IconButton";
import { cn } from "../../../lib/cn";
import type { Division, MapMode } from "../../homepage/types";
import type { MunicityMeta, ProvinceGeoJSON, Region } from "../types";
import type { TravelStore } from "../../travel/types";
import { ProfileMenu } from "./ProfileMenu";

interface MapToolbarProps {
    onSearchClick: () => void;
    onScreenshotClick: () => void;
    onExportClick: () => void;
    isCapturing?: boolean;
    isExporting?: boolean;
    travelStore: TravelStore;
    regions: Region[];
    provinces: ProvinceGeoJSON[];
    municityMeta: MunicityMeta[];
    onViewOnMap: (division: Division, mapMode: MapMode) => void;
}

export function MapToolbar({
    onSearchClick,
    onScreenshotClick,
    onExportClick,
    isCapturing = false,
    isExporting = false,
    travelStore,
    regions,
    provinces,
    municityMeta,
    onViewOnMap,
}: MapToolbarProps) {
    return (
        <div className={cn("absolute right-4 top-4 z-[1000] flex items-center gap-2")}>
            <IconButton icon={Search} label="Search" onClick={onSearchClick} />
            <IconButton
                icon={Camera}
                label="Screenshot map"
                onClick={onScreenshotClick}
                disabled={isCapturing}
            />
            <IconButton
                iconNode={<FaArrowUpFromBracket size={16} />}
                label="Export map"
                onClick={onExportClick}
                disabled={isExporting}
                loading={isExporting}
            />
            <ProfileMenu
                travelStore={travelStore}
                regions={regions}
                provinces={provinces}
                municityMeta={municityMeta}
                onViewOnMap={onViewOnMap}
            />
        </div>
    );
}
