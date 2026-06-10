import { X } from "lucide-react";
import type { Division } from "../types";
import { divisionLevelLabel } from "../types";
import type { ExploreViewTab } from "./DivisionExploreSection";
import { ExploreViewTabs, getAvailableViewTabs } from "./DivisionExploreSection";

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

    return (
        <div style={{ marginBottom: 20 }}>
            <div className="division-summary__top-row">
                <div className="label-mono">{typeLabel}</div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close panel"
                        className="modal-close"
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                )}
            </div>
            <h2
                style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 26,
                    marginTop: 4,
                    marginBottom: 4,
                }}
            >
                {division.name}
            </h2>
            {breadcrumb && (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                    {breadcrumb}
                </p>
            )}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                    gap: 8,
                }}
            >
                {stats.map((s) => (
                    <div
                        key={s.label}
                        style={{
                            background: "var(--bg-parchment)",
                            border: "1px solid var(--border-light)",
                            borderRadius: 6,
                            padding: "8px 10px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 18,
                                fontWeight: 500,
                                color: "var(--accent)",
                            }}
                        >
                            {s.value}
                        </div>
                        <div className="label-mono" style={{ marginTop: 2 }}>
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>

            {viewTab != null && onViewTabChange && (
                <ExploreViewTabs
                    tabs={getAvailableViewTabs(division.level)}
                    active={viewTab}
                    onChange={onViewTabChange}
                />
            )}

            {progress != null && (
                <div style={{ marginTop: 12 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                            fontSize: 12,
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-muted)",
                        }}
                    >
                        <span>{progressLabel}</span>
                        <span>
                            {progress.visited}/{progress.total}
                        </span>
                    </div>
                    <div
                        className="progress-bar"
                        title={`${progress.visited} of ${progress.total} ${progressLabel}`}
                    >
                        <div
                            className="progress-bar__fill"
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
