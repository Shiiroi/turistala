import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../hooks/useToast";
import { provinceToDivision, regionToDivision } from "../../homepage/hooks/useMapSelection";
import type { Division, MapMode } from "../../homepage/types";
import type { MunicityMeta, ProvinceGeoJSON, Region } from "../../map/types";
import type { TravelStore } from "../../travel/types";
import { usePassportStats } from "../hooks/usePassportStats";
import type { PassportProgressLevel } from "../types";
import { PASSPORT_PROGRESS_OPTIONS } from "../types";
import {
    computeProvinceChildren,
    computeRegionChildren,
    progressLineFromStats,
    type ProvincialProgressBy,
    type RegionalProgressBy,
} from "../utils/computePassportStats";
import {
    buildPassportCoverSvg,
    buildProvincialStampsSvg,
    buildRegionalStampsSvg,
    downloadPassportPng,
    downloadSingleStampPng,
    type ExportStamp,
} from "../utils/exportPassportImage";
import {
    filterProvincesForProgress,
    type ProvinceFilterOptions,
} from "../utils/provinceFilters";
import { PassportBooklet } from "./PassportBooklet";
import { PassportOptionsModal, type OptionsPanel } from "./PassportOptionsModal";
import { PassportSectionHeader } from "./PassportSectionHeader";
import { StampBadge } from "./StampBadge";
import { StampDetailModal } from "./StampDetailModal";
import type { StampSelection } from "./StampDetailPanel";

type ProvinceStampFilter = "all" | "started";
type ExportKind = "passport" | "regions" | "provinces";

const DEFAULT_PASSPORT_PROGRESS: PassportProgressLevel[] = [
    "regions",
    "provinces",
    "municipalities",
];

const REGIONAL_PROGRESS_OPTIONS: { value: RegionalProgressBy; label: string }[] = [
    { value: "provinces", label: "Provinces" },
    { value: "municipalities", label: "Municipalities" },
    { value: "places", label: "Places" },
];

const PROVINCIAL_PROGRESS_OPTIONS: { value: ProvincialProgressBy; label: string }[] = [
    { value: "municipalities", label: "Municipalities" },
    { value: "places", label: "Places" },
];

interface PassportModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
    initials: string;
    avatarUrl?: string | null;
    passportId: string;
    isDemo: boolean;
    travelStore: TravelStore;
    regions: Region[];
    provinces: ProvinceGeoJSON[];
    municityMeta: MunicityMeta[];
    onViewOnMap: (division: Division, mapMode: MapMode) => void;
}

function slugify(s: string): string {
    return s.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase() || "traveler";
}

export function PassportModal({
    isOpen,
    onClose,
    username,
    initials,
    avatarUrl,
    passportId,
    isDemo,
    travelStore,
    regions,
    provinces,
    municityMeta,
    onViewOnMap,
}: PassportModalProps) {
    const { success: toastSuccess, error: toastError } = useToast();
    const [passportProgressLevels, setPassportProgressLevels] =
        useState<PassportProgressLevel[]>(DEFAULT_PASSPORT_PROGRESS);
    const [regionalProgressBy, setRegionalProgressBy] = useState<RegionalProgressBy>("provinces");
    const [provincialProgressBy, setProvincialProgressBy] =
        useState<ProvincialProgressBy>("municipalities");
    const [includeMM, setIncludeMM] = useState(true);
    const [includeSGA, setIncludeSGA] = useState(true);
    const [provinceStampFilter, setProvinceStampFilter] = useState<ProvinceStampFilter>("all");
    const [stampSelection, setStampSelection] = useState<StampSelection>(null);
    const [optionsPanel, setOptionsPanel] = useState<OptionsPanel | null>(null);
    const [exporting, setExporting] = useState<ExportKind | "stamp" | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setStampSelection(null);
            setOptionsPanel(null);
        }
    }, [isOpen]);

    const passportIncludesProvinces = passportProgressLevels.includes("provinces");

    const provinceFilter = useMemo<ProvinceFilterOptions>(
        () => ({ includeMM, includeSGA }),
        [includeMM, includeSGA],
    );

    const passportProvinceFilter = passportIncludesProvinces ? provinceFilter : undefined;
    const regionalProvinceFilter =
        regionalProgressBy === "provinces" ? provinceFilter : undefined;

    const regionStampStats = usePassportStats(
        regionalProgressBy,
        travelStore,
        regions,
        provinces,
        municityMeta,
        regionalProvinceFilter,
    );
    const provinceStampStats = usePassportStats(
        provincialProgressBy,
        travelStore,
        regions,
        provinces,
        municityMeta,
    );

    const passportRegionStats = usePassportStats(
        "regions",
        travelStore,
        regions,
        provinces,
        municityMeta,
    );
    const passportProvinceStats = usePassportStats(
        "provinces",
        travelStore,
        regions,
        provinces,
        municityMeta,
        passportProvinceFilter,
    );
    const passportMuniStats = usePassportStats(
        "municipalities",
        travelStore,
        regions,
        provinces,
        municityMeta,
    );
    const passportPlaceStats = usePassportStats(
        "places",
        travelStore,
        regions,
        provinces,
        municityMeta,
    );

    const passportStatsByLevel = useMemo(
        () => ({
            regions: passportRegionStats,
            provinces: passportProvinceStats,
            municipalities: passportMuniStats,
            places: passportPlaceStats,
        }),
        [passportRegionStats, passportProvinceStats, passportMuniStats, passportPlaceStats],
    );

    const progressLines = useMemo(
        () =>
            PASSPORT_PROGRESS_OPTIONS.filter((o) => passportProgressLevels.includes(o.value)).map(
                (o) => progressLineFromStats(passportStatsByLevel[o.value]),
            ),
        [passportProgressLevels, passportStatsByLevel],
    );

    const regionGeometry = useMemo(() => {
        const map = new Map<number, Region>();
        for (const r of regions) map.set(r.id, r);
        return map;
    }, [regions]);

    const provinceGeometry = useMemo(() => {
        const map = new Map<number, ProvinceGeoJSON>();
        for (const p of provinces) map.set(p.id, p);
        return map;
    }, [provinces]);

    const regionNameById = useMemo(() => {
        const map = new Map<number, string>();
        for (const r of regions) map.set(r.id, r.name);
        return map;
    }, [regions]);

    const allProvinces = useMemo(
        () => provinceStampStats.regions.flatMap((r) => r.provinces),
        [provinceStampStats.regions],
    );

    const filteredProvinces = useMemo(() => {
        let rows = allProvinces.filter((p) => {
            const geo = provinceGeometry.get(p.id);
            if (!geo) return false;
            return filterProvincesForProgress([geo], provinceFilter).length > 0;
        });
        if (provinceStampFilter === "started") {
            rows = rows.filter((p) => p.fraction > 0 || p.total === 0);
        }
        return rows;
    }, [allProvinces, provinceFilter, provinceGeometry, provinceStampFilter]);

    function openStampSelection(next: StampSelection) {
        setStampSelection((current) => {
            if (current && next && current.kind === next.kind && current.id === next.id) {
                return null;
            }
            return next;
        });
    }

    function toExportStamp(
        row: { id: number; name: string; fraction: number; visited: number; total: number },
        geometryMap: Map<number, { geometry: ProvinceGeoJSON["geometry"] } | Region>,
    ): ExportStamp {
        return {
            id: row.id,
            name: row.name,
            fraction: row.fraction,
            visited: row.visited,
            total: row.total,
            geometry: geometryMap.get(row.id)?.geometry,
        };
    }

    async function handleDownload(kind: ExportKind) {
        setExporting(kind);
        try {
            const safeName = slugify(username);
            let svg: string;
            let filename: string;

            if (kind === "passport") {
                svg = buildPassportCoverSvg({
                    progressLines,
                    username,
                    initials,
                    avatarUrl,
                    passportId,
                    phGeometries: regions.map((r) => r.geometry),
                });
                filename = `turistala-passport-${safeName}.png`;
            } else if (kind === "regions") {
                const stamps = regionStampStats.regions.map((r) =>
                    toExportStamp(r, regionGeometry as Map<number, Region>),
                );
                svg = buildRegionalStampsSvg(stamps, regionalProgressBy);
                filename = `turistala-passport-regions-${safeName}.png`;
            } else {
                const stamps = filteredProvinces.map((p) =>
                    toExportStamp(p, provinceGeometry as Map<number, ProvinceGeoJSON>),
                );
                svg = buildProvincialStampsSvg(stamps, provincialProgressBy);
                filename = `turistala-passport-provinces-${safeName}.png`;
            }

            await downloadPassportPng(svg, filename);
            toastSuccess("Saved as PNG");
        } catch {
            toastError("Could not export passport");
        } finally {
            setExporting(null);
        }
    }

    async function handleDownloadStamp(stamp: ExportStamp) {
        setExporting("stamp");
        try {
            const safeName = slugify(username);
            const stampSlug = slugify(stamp.name);
            await downloadSingleStampPng(
                stamp,
                `turistala-stamp-${stampSlug}-${safeName}.png`,
            );
            toastSuccess("Saved stamp PNG");
        } catch {
            toastError("Could not export stamp");
        } finally {
            setExporting(null);
        }
    }

    function handleViewRegion(regionId: number) {
        const region = regions.find((r) => r.id === regionId);
        if (!region) return;
        onViewOnMap(regionToDivision(region), "province");
        onClose();
    }

    function handleViewProvince(provinceId: number) {
        const province = provinces.find((p) => p.id === provinceId);
        if (!province) return;
        onViewOnMap(provinceToDivision(province), "municipality");
        onClose();
    }

    const selectedRegionRow =
        stampSelection?.kind === "region"
            ? regionStampStats.regions.find((r) => r.id === stampSelection.id)
            : undefined;

    const selectedProvinceRow =
        stampSelection?.kind === "province"
            ? allProvinces.find((p) => p.id === stampSelection.id)
            : undefined;

    const regionChildren = useMemo(() => {
        if (!selectedRegionRow) return [];
        return computeRegionChildren(
            selectedRegionRow.id,
            regionalProgressBy,
            travelStore,
            provinces,
            municityMeta,
            regionalProvinceFilter,
        );
    }, [
        selectedRegionRow,
        regionalProgressBy,
        travelStore,
        provinces,
        municityMeta,
        regionalProvinceFilter,
    ]);

    const provinceChildren = useMemo(() => {
        if (!selectedProvinceRow) return [];
        return computeProvinceChildren(
            selectedProvinceRow.id,
            provincialProgressBy,
            travelStore,
            municityMeta,
        );
    }, [selectedProvinceRow, provincialProgressBy, travelStore, municityMeta]);

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="My Passport"
                subtitle={
                    isDemo
                        ? "Your Traveler Pass on this device. Sign up to keep it in the cloud."
                        : "Collect regional and provincial stamps as you explore"
                }
                size="xl"
            >
                {travelStore.isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-muted">
                        <Loader2 size={20} className="animate-spin text-accent" />
                        <span className="text-sm">Loading travel data…</span>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="space-y-3 rounded-lg border border-border-light bg-parchment/40 p-4">
                            <PassportSectionHeader
                                title="Passport"
                                onOptionsClick={() => setOptionsPanel("passport")}
                                optionsLabel="Passport options"
                            />
                            <PassportBooklet
                                progressLines={progressLines}
                                username={username}
                                initials={initials}
                                avatarUrl={avatarUrl}
                                passportId={passportId}
                                regions={regions}
                            />
                            <Button
                                size="sm"
                                onClick={() => handleDownload("passport")}
                                loading={exporting === "passport"}
                                disabled={exporting != null || progressLines.length === 0}
                            >
                                <Download size={14} className="mr-1.5" />
                                Passport PNG
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <PassportSectionHeader
                                title="Regional stamps"
                                onOptionsClick={() => setOptionsPanel("regional")}
                                optionsLabel="Regional stamp options"
                            />
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3">
                                {regionStampStats.regions.map((region) => (
                                    <StampBadge
                                        key={region.id}
                                        id={region.id}
                                        name={region.name}
                                        fraction={region.fraction}
                                        visited={region.visited}
                                        total={region.total}
                                        geometry={regionGeometry.get(region.id)?.geometry}
                                        onClick={() =>
                                            openStampSelection({ kind: "region", id: region.id })
                                        }
                                    />
                                ))}
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleDownload("regions")}
                                loading={exporting === "regions"}
                                disabled={exporting != null}
                            >
                                <Download size={14} className="mr-1.5" />
                                Regional PNG
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <PassportSectionHeader
                                title="Provincial stamps"
                                onOptionsClick={() => setOptionsPanel("provincial")}
                                optionsLabel="Provincial stamp options"
                            />
                            {filteredProvinces.length === 0 ? (
                                <p className="text-sm italic text-muted">
                                    No provinces to show with the current filters.
                                </p>
                            ) : (
                                <div className="grid max-h-80 grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2 overflow-y-auto pr-1">
                                    {filteredProvinces.map((province) => {
                                        const geo = provinceGeometry.get(province.id);
                                        return (
                                            <StampBadge
                                                key={province.id}
                                                id={province.id}
                                                name={province.name}
                                                fraction={province.fraction}
                                                visited={province.visited}
                                                total={province.total}
                                                geometry={geo?.geometry}
                                                size="sm"
                                                onClick={() =>
                                                    openStampSelection({
                                                        kind: "province",
                                                        id: province.id,
                                                    })
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            )}
                            <Button
                                size="sm"
                                onClick={() => handleDownload("provinces")}
                                loading={exporting === "provinces"}
                                disabled={exporting != null}
                            >
                                <Download size={14} className="mr-1.5" />
                                Provincial PNG
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <PassportOptionsModal
                panel={optionsPanel}
                onClose={() => setOptionsPanel(null)}
                passportProgressLevels={passportProgressLevels}
                onPassportProgressChange={setPassportProgressLevels}
                passportIncludesProvinces={passportIncludesProvinces}
                includeMM={includeMM}
                includeSGA={includeSGA}
                onIncludeMMChange={setIncludeMM}
                onIncludeSGAChange={setIncludeSGA}
                regionalProgressBy={regionalProgressBy}
                onRegionalProgressByChange={setRegionalProgressBy}
                regionalProgressOptions={REGIONAL_PROGRESS_OPTIONS}
                provincialProgressBy={provincialProgressBy}
                onProvincialProgressByChange={setProvincialProgressBy}
                provincialProgressOptions={PROVINCIAL_PROGRESS_OPTIONS}
                provinceStampFilter={provinceStampFilter}
                onProvinceStampFilterChange={setProvinceStampFilter}
            />

            {selectedRegionRow && stampSelection?.kind === "region" && (
                <StampDetailModal
                    isOpen
                    kind="region"
                    id={selectedRegionRow.id}
                    name={selectedRegionRow.name}
                    fraction={selectedRegionRow.fraction}
                    visited={selectedRegionRow.visited}
                    total={selectedRegionRow.total}
                    geometry={regionGeometry.get(selectedRegionRow.id)?.geometry}
                    childMetric={regionalProgressBy}
                    children={regionChildren}
                    onClose={() => setStampSelection(null)}
                    onViewOnMap={() => handleViewRegion(selectedRegionRow.id)}
                    onDownloadStamp={() =>
                        handleDownloadStamp(
                            toExportStamp(
                                selectedRegionRow,
                                regionGeometry as Map<number, Region>,
                            ),
                        )
                    }
                    downloading={exporting === "stamp"}
                    onChildClick={(row) => openStampSelection({ kind: "province", id: row.id })}
                />
            )}

            {selectedProvinceRow && stampSelection?.kind === "province" && (
                <StampDetailModal
                    isOpen
                    kind="province"
                    id={selectedProvinceRow.id}
                    name={selectedProvinceRow.name}
                    subtitle={
                        regionNameById.get(
                            provinceGeometry.get(selectedProvinceRow.id)?.region_id ?? 0,
                        ) ?? undefined
                    }
                    fraction={selectedProvinceRow.fraction}
                    visited={selectedProvinceRow.visited}
                    total={selectedProvinceRow.total}
                    geometry={provinceGeometry.get(selectedProvinceRow.id)?.geometry}
                    childMetric={provincialProgressBy}
                    children={provinceChildren}
                    onClose={() => setStampSelection(null)}
                    onViewOnMap={() => handleViewProvince(selectedProvinceRow.id)}
                    onDownloadStamp={() =>
                        handleDownloadStamp(
                            toExportStamp(
                                selectedProvinceRow,
                                provinceGeometry as Map<number, ProvinceGeoJSON>,
                            ),
                        )
                    }
                    downloading={exporting === "stamp"}
                />
            )}
        </>
    );
}
