import { Check, ChevronDown, MapPin, X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/cn";
import type { DivisionProgress, PassportProgressLevel } from "../types";
import { formatProgressDisplay } from "../utils/computePassportStats";

interface PassportProgressRowProps {
    row: DivisionProgress;
    metric: PassportProgressLevel;
    parentKind: "region" | "province";
    level?: "region" | "province" | "child";
    expanded?: boolean;
    onToggle?: () => void;
    onClick?: () => void;
    onViewOnMap?: () => void;
    nested?: boolean;
}

export function PassportProgressRow({
    row,
    metric,
    parentKind,
    level = "child",
    expanded,
    onToggle,
    onClick,
    onViewOnMap,
    nested = false,
}: PassportProgressRowProps) {
    const display = formatProgressDisplay(row, metric, level, parentKind);
    const pct = row.total > 0 ? Math.round(row.fraction * 100) : 0;
    const hasExpand = onToggle != null;
    const isClickable = onClick != null;

    return (
        <div className={cn(nested && "ml-3 border-l-2 border-border-light pl-3")}>
            <div className="flex items-center gap-2 py-2">
                {hasExpand ? (
                    <button
                        type="button"
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                        onClick={onToggle}
                    >
                        <ChevronDown
                            size={14}
                            className={cn(
                                "shrink-0 text-muted transition-transform duration-150",
                                expanded && "rotate-180",
                            )}
                        />
                        <span className="truncate font-medium text-primary">{row.name}</span>
                    </button>
                ) : isClickable ? (
                    <button
                        type="button"
                        className="min-w-0 flex-1 cursor-pointer truncate text-left font-medium text-primary hover:text-accent"
                        onClick={onClick}
                    >
                        {row.name}
                    </button>
                ) : (
                    <span className="min-w-0 flex-1 truncate font-medium text-primary">{row.name}</span>
                )}
                <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-muted">
                    {display.isBinary ? (
                        <>
                            {display.checked ? (
                                <Check size={14} className="text-accent" aria-label="Visited" />
                            ) : (
                                <X size={14} className="text-muted/60" aria-label="Not visited" />
                            )}
                            {display.pctText != null && <> · {display.pctText}</>}
                        </>
                    ) : (
                        <>
                            {display.countText}
                            {display.pctText != null && <> · {display.pctText}</>}
                        </>
                    )}
                </span>
                {onViewOnMap && (
                    <Button size="sm" variant="ghost" onClick={onViewOnMap} className="shrink-0 px-2">
                        <MapPin size={14} />
                    </Button>
                )}
            </div>
            {(display.pctText != null || row.total > 0) && (
                <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-border-light">
                    <div
                        className="h-full rounded-full bg-accent transition-[width] duration-300"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    );
}
