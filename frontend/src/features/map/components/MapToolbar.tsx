import { Camera, Search } from "lucide-react";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import { IconButton } from "../../../components/ui/IconButton";
import { cn } from "../../../lib/cn";
import { ProfileMenu } from "./ProfileMenu";

interface MapToolbarProps {
    onSearchClick: () => void;
}

export function MapToolbar({ onSearchClick }: MapToolbarProps) {
    return (
        <div className={cn("absolute right-4 top-4 z-[1000] flex items-center gap-2")}>
            <IconButton icon={Search} label="Search" onClick={onSearchClick} />
            <IconButton
                icon={Camera}
                label="Screenshot map"
                onClick={() => console.log({ action: "SCREENSHOT_MAP" })}
            />
            <IconButton
                iconNode={<FaArrowUpFromBracket size={16} />}
                label="Export map image"
                onClick={() => console.log({ action: "EXPORT_MAP_IMAGE" })}
            />
            <ProfileMenu />
        </div>
    );
}
