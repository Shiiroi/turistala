import { SlidersHorizontal } from "lucide-react";
import { IconButton } from "../../../components/ui/IconButton";

interface PassportSectionHeaderProps {
    title: string;
    onOptionsClick: () => void;
    optionsLabel?: string;
}

export function PassportSectionHeader({
    title,
    onOptionsClick,
    optionsLabel = "Section options",
}: PassportSectionHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-3">
            <p className="font-display text-base font-semibold text-primary">{title}</p>
            <IconButton
                icon={SlidersHorizontal}
                label={optionsLabel}
                onClick={onOptionsClick}
                className="size-8 shrink-0"
            />
        </div>
    );
}
