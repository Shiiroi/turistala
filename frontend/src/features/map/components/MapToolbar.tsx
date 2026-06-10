import { Camera, Search } from "lucide-react";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import { IconButton } from "../../../components/ui/IconButton";
import { ProfileMenu } from "./ProfileMenu";

interface MapToolbarProps {
    onSearchClick: () => void;
}

export function MapToolbar({ onSearchClick }: MapToolbarProps) {
    return (
        <div
            style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 1000,
                display: "flex",
                gap: 8,
                alignItems: "center",
            }}
        >
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
