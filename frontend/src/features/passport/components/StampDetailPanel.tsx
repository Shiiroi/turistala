import { Download, MapPin } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { Geometry } from "geojson";
import type { DivisionProgress } from "../types";
import type { RegionalProgressBy, ProvincialProgressBy } from "../utils/computePassportStats";
import { metricUnitLabel, summarizeChildProgress } from "../utils/computePassportStats";
import { PassportProgressRow } from "./PassportProgressRow";
import { StampBadge } from "./StampBadge";

export type StampSelection =
    | { kind: "region"; id: number }
    | { kind: "province"; id: number }
    | null;

interface StampDetailPanelProps {
    kind: "region" | "province";
    id: number;
    name: string;
    subtitle?: string;
    fraction: number;
    visited: number;
    total: number;
    geometry?: Geometry;
    childMetric: RegionalProgressBy | ProvincialProgressBy;
    children: DivisionProgress[];
    onViewOnMap: () => void;
    onDownloadStamp: () => void;
    onChildClick?: (row: DivisionProgress) => void;
    downloading?: boolean;
}

export function StampDetailPanel({
    kind,
    id,
    name,
    subtitle,
    fraction,
    visited,
    total,
    geometry,
    childMetric,
    children,
    onViewOnMap,
    onDownloadStamp,
    onChildClick,
    downloading = false,
}: StampDetailPanelProps) {
    const childLevel = kind === "region" ? "province" : "child";
    const summary = summarizeChildProgress(children, childMetric, kind, { visited, total });

    return (
        <div>
            <div className="mb-4 flex min-w-0 items-start gap-3">
                <StampBadge
                    id={id}
                    name={name}
                    fraction={fraction}
                    visited={visited}
                    total={total}
                    geometry={geometry}
                    size="lg"
                />
                <div className="min-w-0 pt-1">
                    {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
                    <p className="mt-1 font-mono text-xs text-muted">
                        By {metricUnitLabel(childMetric)}
                    </p>
                </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={onDownloadStamp} loading={downloading}>
                    <Download size={14} className="mr-1.5" />
                    Download stamp
                </Button>
                <Button size="sm" variant="secondary" onClick={onViewOnMap}>
                    <MapPin size={14} className="mr-1.5" />
                    View on map
                </Button>
            </div>

            <div className="max-h-52 space-y-0 overflow-y-auto border-t border-border-light pt-2">
                {children.length === 0 ? (
                    <p className="py-3 text-sm italic text-muted">No tracked progress here yet.</p>
                ) : (
                    <>
                        <p className="mb-2 font-mono text-xs text-muted">{summary.text}</p>
                        {children.map((row) => (
                        <PassportProgressRow
                            key={row.placeId ?? `${row.id}-${row.name}`}
                            row={row}
                            metric={childMetric}
                            parentKind={kind}
                            level={childLevel}
                            onClick={
                                onChildClick && row.id > 0 && !row.placeId
                                    ? () => onChildClick(row)
                                    : undefined
                            }
                        />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
