// Configuration dialog for PNG or JSON map and travel exports.

import { useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { Modal } from "../../../components/ui/Modal";
import { PillTabs } from "../../../components/ui/PillTabs";
import { cn } from "../../../lib/cn";
import type { MunicityMeta, ProvinceGeoJSON, Region } from "../types";
import type {
    MapExportConfig,
    MapExportFormat,
    MapExportLevel,
    MapExportProgressBy,
    MapExportScope,
} from "../types/mapExport";

type ScopeMode = MapExportScope["kind"];

interface MapExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    regions: Region[];
    provinces: ProvinceGeoJSON[];
    municityMeta: MunicityMeta[];
    onExport: (config: MapExportConfig) => void;
    exporting?: boolean;
}

const FORMAT_OPTIONS: { value: MapExportFormat; label: string }[] = [
    { value: "png", label: "PNG" },
    { value: "json", label: "JSON" },
];

const LEVEL_OPTIONS: { value: MapExportLevel; label: string }[] = [
    { value: "region", label: "Region" },
    { value: "province", label: "Province" },
    { value: "municipality", label: "Municipality" },
];

const PROGRESS_OPTIONS: { value: MapExportProgressBy; label: string }[] = [
    { value: "provinces", label: "Provinces" },
    { value: "municipalities", label: "Municipalities" },
    { value: "places", label: "Places" },
];

 // Performs operations for defaultScopeMode in MapExportModal.tsx.
function defaultScopeMode(): ScopeMode {
    return "all";
}

 /**
  * Performs operations for scopeForMode in MapExportModal.tsx.
  * @param mode - Parameter representing mode.
  * @param _level - Parameter representing _level.
  * @param pickIds - Parameter representing pickIds.
  * @param regionId - Parameter representing regionId.
  * @param provinceId - Parameter representing provinceId.
 */
function scopeForMode(mode: ScopeMode, _level: MapExportLevel, pickIds: number[], regionId: number | null, provinceId: number | null): MapExportScope {
    if (mode === "all") return { kind: "all" };
    if (mode === "pick") return { kind: "pick", ids: pickIds };
    if (mode === "inRegion" && regionId != null) return { kind: "inRegion", regionId };
    if (mode === "inProvince" && provinceId != null) return { kind: "inProvince", provinceId };
    return { kind: "all" };
}

 /**
  * Performs operations for scopeModesForLevel in MapExportModal.tsx.
  * @param level - Parameter representing level.
 */
function scopeModesForLevel(level: MapExportLevel): { value: ScopeMode; label: string }[] {
    switch (level) {
        case "region":
            return [
                { value: "all", label: "Whole Philippines" },
                { value: "pick", label: "Selected regions" },
            ];
        case "province":
            return [
                { value: "all", label: "Whole Philippines" },
                { value: "pick", label: "Selected provinces" },
                { value: "inRegion", label: "Provinces in a region" },
            ];
        case "municipality":
            return [
                { value: "all", label: "Whole Philippines" },
                { value: "pick", label: "Selected municipalities" },
                { value: "inProvince", label: "Municipalities in a province" },
                { value: "inRegion", label: "Municipalities in a region" },
            ];
    }
}

export function MapExportModal({
    isOpen,
    onClose,
    regions,
    provinces,
    municityMeta,
    onExport,
    exporting = false,
}: MapExportModalProps) {
    const [format, setFormat] = useState<MapExportFormat>("png");
    const [level, setLevel] = useState<MapExportLevel>("region");
    const [progressBy, setProgressBy] = useState<MapExportProgressBy>("provinces");
    const [scopeMode, setScopeMode] = useState<ScopeMode>("all");
    const [pickIds, setPickIds] = useState<number[]>([]);
    const [regionId, setRegionId] = useState<number | null>(regions[0]?.id ?? null);
    const [provinceId, setProvinceId] = useState<number | null>(provinces[0]?.id ?? null);
    const [search, setSearch] = useState("");

    const scopeModes = scopeModesForLevel(level);

    const scopeListOptions = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (scopeMode === "inRegion") {
            return regions
                .filter((r) => !q || r.name.toLowerCase().includes(q))
                .map((r) => ({ id: r.id, name: r.name }));
        }
        if (scopeMode === "inProvince") {
            return provinces
                .filter((p) => !q || p.name.toLowerCase().includes(q))
                .map((p) => ({ id: p.id, name: p.name }));
        }
        if (scopeMode === "pick") {
            switch (level) {
                case "region":
                    return regions
                        .filter((r) => !q || r.name.toLowerCase().includes(q))
                        .map((r) => ({ id: r.id, name: r.name }));
                case "province":
                    return provinces
                        .filter((p) => !q || p.name.toLowerCase().includes(q))
                        .map((p) => ({ id: p.id, name: p.name }));
                case "municipality":
                    return municityMeta
                        .filter((m) => !q || m.name.toLowerCase().includes(q))
                        .slice(0, q ? 200 : 100)
                        .map((m) => ({ id: m.id, name: m.name }));
            }
        }
        return [];
    }, [scopeMode, level, search, regions, provinces, municityMeta]);

    const scopeSearchPlaceholder = useMemo(() => {
        if (scopeMode === "inRegion") return "Search regions…";
        if (scopeMode === "inProvince") return "Search provinces…";
        if (level === "municipality") return "Search municipalities…";
        return `Search ${level}s…`;
    }, [scopeMode, level]);

    const showScopeList = scopeMode === "pick" || scopeMode === "inRegion" || scopeMode === "inProvince";

    function handleLevelChange(next: MapExportLevel) {
        setLevel(next);
        setScopeMode(defaultScopeMode());
        setPickIds([]);
        setSearch("");
    }

    function togglePick(id: number) {
        setPickIds((current) =>
            current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
        );
    }

    function selectSingle(id: number) {
        if (scopeMode === "inRegion") setRegionId(id);
        else if (scopeMode === "inProvince") setProvinceId(id);
    }

    function isSingleSelected(id: number): boolean {
        if (scopeMode === "inRegion") return regionId === id;
        if (scopeMode === "inProvince") return provinceId === id;
        return false;
    }

    function handleExportClick() {
        const scope = scopeForMode(scopeMode, level, pickIds, regionId, provinceId);
        if (scope.kind === "pick" && scope.ids.length === 0) return;
        onExport({ format, level, progressBy, scope });
    }

    const canExport =
        scopeMode !== "pick" || pickIds.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export map" subtitle="Choose scope and format" size="md">
            <div className="space-y-4">
                <div>
                    <Label className="mb-2">
                        Format
                    </Label>
                    <PillTabs value={format} options={FORMAT_OPTIONS} onChange={setFormat} />
                </div>

                <div>
                    <Label className="mb-2">
                        Export level
                    </Label>
                    <PillTabs value={level} options={LEVEL_OPTIONS} onChange={handleLevelChange} />
                </div>

                <div>
                    <Label className="mb-2">
                        Progress by
                    </Label>
                    <PillTabs value={progressBy} options={PROGRESS_OPTIONS} onChange={setProgressBy} />
                </div>

                <div>
                    <Label className="mb-2">
                        Scope
                    </Label>
                    <PillTabs
                        value={scopeMode}
                        options={scopeModes}
                        onChange={(mode) => {
                            setScopeMode(mode);
                            setPickIds([]);
                            setSearch("");
                        }}
                        className="mb-3"
                    />

                    {showScopeList && (
                        <div>
                            <Input
                                placeholder={scopeSearchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border-light">
                                {scopeListOptions.map((item) => {
                                    const isMulti = scopeMode === "pick";
                                    const selected = isMulti
                                        ? pickIds.includes(item.id)
                                        : isSingleSelected(item.id);
                                    return (
                                        <label
                                            key={item.id}
                                            className={cn(
                                                "flex cursor-pointer items-center gap-2 border-b border-border-light px-3 py-2 text-sm last:border-b-0",
                                                selected && "bg-accent/5",
                                            )}
                                        >
                                            <input
                                                type={isMulti ? "checkbox" : "radio"}
                                                name="export-scope"
                                                checked={selected}
                                                onChange={() =>
                                                    isMulti ? togglePick(item.id) : selectSingle(item.id)
                                                }
                                                className="accent-accent"
                                            />
                                            <span className="text-primary">{item.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            {scopeMode === "pick" && pickIds.length > 0 && (
                                <p className="mt-1 font-mono text-xs text-muted">
                                    {pickIds.length} selected
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={onClose} disabled={exporting}>
                        Cancel
                    </Button>
                    <Button onClick={handleExportClick} loading={exporting} disabled={!canExport || exporting}>
                        Export
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
