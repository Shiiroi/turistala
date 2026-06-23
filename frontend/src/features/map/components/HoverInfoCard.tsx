// HoverInfoCard.tsx — Top-left map overlay showing hovered division or default branding.

import { TuristalaLogo } from "../../../components/TuristalaLogo";
import { cn } from "../../../lib/cn";
import type { Division } from "../../homepage/types";
import { divisionLevelLabel } from "../../homepage/types";

interface HoverInfoCardProps {
    hoveredDivision: Division | null;
}

const textShadowClass =
    "[text-shadow:0_1px_3px_rgba(251,247,240,1),0_0_12px_rgba(251,247,240,0.95),0_2px_4px_rgba(44,36,22,0.15)]";

export function HoverInfoCard({ hoveredDivision }: HoverInfoCardProps) {
    return (
        <div className="pointer-events-none absolute left-4 top-4 z-[1000] max-w-[360px]">
            {hoveredDivision ? (
                <>
                    <div
                        className={cn(
                            "font-mono text-[13px] uppercase tracking-[0.06em] text-primary",
                            textShadowClass,
                        )}
                    >
                        {divisionLevelLabel(hoveredDivision.level)}
                    </div>
                    <div
                        className={cn(
                            "mt-1.5 font-display text-[26px] font-bold leading-[1.15] text-primary",
                            textShadowClass,
                        )}
                    >
                        {hoveredDivision.name}
                    </div>
                </>
            ) : (
                <>
                    <TuristalaLogo
                        size={28}
                        className="gap-2"
                        showWordmark
                        wordmarkClassName="font-mono text-[13px] font-normal uppercase tracking-[0.06em] text-primary [text-shadow:0_1px_3px_rgba(251,247,240,1),0_0_12px_rgba(251,247,240,0.95),0_2px_4px_rgba(44,36,22,0.15)]"
                    />
                    <div
                        className={cn(
                            "mt-1.5 font-display text-[22px] font-semibold leading-tight text-primary",
                            textShadowClass,
                        )}
                    >
                        Explore the Philippines
                    </div>
                </>
            )}
        </div>
    );
}
