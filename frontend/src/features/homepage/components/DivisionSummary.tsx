import { X } from "lucide-react";
import { CloseButton } from "../../../components/ui/CloseButton";
import { Label } from "../../../components/ui/Label";
import { PillTabs } from "../../../components/ui/PillTabs";
import type { Division } from "../types";
import { divisionLevelLabel } from "../types";
import type { ExploreViewTab } from "./divisionExploreUtils";
import { getAvailableViewTabs } from "./divisionExploreUtils";

interface DivisionSummaryProps {
    division: Division;
    parentRegionName?: string;
    parentProvinceName?: string;
    stats: { label: string; value: string | number }[];
    progress?: { visited: number; total: number };
    progressLabel?: string;
    viewTab?: ExploreViewTab;
    onViewTabChange?: (tab: ExploreViewTab) => void;
    onClose?: () => void;
}

const VIEW_TAB_LABELS: Record<ExploreViewTab, string> = {
    provinces: "Provinces",
    municipalities: "Municipalities",
    places: "Places",
};

export function DivisionSummary({
    division,
    parentRegionName,
    parentProvinceName,
    stats,
    progress,
    progressLabel = "visited",
    viewTab,
    onViewTabChange,
    onClose,
}: DivisionSummaryProps) {
    const breadcrumb = [parentProvinceName, parentRegionName].filter(Boolean).join(" · ");
    const typeLabel =
        division.level === "municipality" && "type" in division
            ? division.type === "city"
                ? "City"
                : "Municipality"
            : divisionLevelLabel(division.level);

    const viewTabs =
        viewTab != null && onViewTabChange ? getAvailableViewTabs(division.level) : [];

    return (
        <div className="mb-5">
            <div className="flex items-center justify-between gap-2">
                <Label>{typeLabel}</Label>
                {onClose && (
                    <CloseButton
                        onClick={onClose}
                        ariaLabel="Close panel"
                        className="hover:bg-border-light"
                    >
                        <X size={20} strokeWidth={2} />
                    </CloseButton>
                )}
            </div>
            <h2 className="mb-1 mt-1 font-display text-[26px] text-primary">{division.name}</h2>
            {breadcrumb && (
                <p className="mb-3 text-[13px] text-muted">{breadcrumb}</p>
            )}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-2">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className="rounded-md border border-border-light bg-parchment px-2.5 py-2 text-center"
                    >
                        <div className="font-mono text-lg font-medium text-accent">{s.value}</div>
                        <Label className="mt-0.5">{s.label}</Label>
                    </div>
                ))}
            </div>

            {viewTabs.length > 1 && viewTab != null && onViewTabChange && (
                <PillTabs
                    value={viewTab}
                    options={viewTabs.map((tab) => ({
                        value: tab,
                        label: VIEW_TAB_LABELS[tab],
                    }))}
                    onChange={onViewTabChange}
                    className="mb-2.5 mt-3.5"
                />
            )}

            {progress != null && (
                <div className="mt-3">
                    <div className="mb-1.5 flex justify-between font-mono text-xs text-muted">
                        <span>{progressLabel}</span>
                        <span>
                            {progress.visited}/{progress.total}
                        </span>
                    </div>
                    <div
                        className="h-1.5 overflow-hidden rounded-full bg-border-light"
                        title={`${progress.visited} of ${progress.total} ${progressLabel}`}
                    >
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--heatmap-2)] to-accent transition-[width] duration-300 ease-in-out"
                            style={{
                                width:
                                    progress.total > 0
                                        ? `${(progress.visited / progress.total) * 100}%`
                                        : "0%",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
