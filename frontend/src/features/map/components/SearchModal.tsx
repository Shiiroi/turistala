import { useMemo, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { municityMetaToDivision, municityToDivision } from "../../homepage/hooks/useMapSelection";
import type { Division, MapMode } from "../../homepage/types";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON, Region } from "../types";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    mapMode: MapMode;
    regions: Region[];
    provinces: ProvinceGeoJSON[];
    municities: MunicityGeoJSON[];
    municityMeta: MunicityMeta[];
    onSelect: (division: Division) => void;
}

export function SearchModal({
    isOpen,
    onClose,
    mapMode,
    regions,
    provinces,
    municities,
    municityMeta,
    onSelect,
}: SearchModalProps) {
    const [query, setQuery] = useState("");

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        switch (mapMode) {
            case "region":
                return regions
                    .filter((r) => r.name.toLowerCase().includes(q))
                    .slice(0, 12)
                    .map((r) => ({ id: r.id, name: r.name, level: "region" as const }));
            case "province":
                return provinces
                    .filter((p) => p.name.toLowerCase().includes(q))
                    .slice(0, 12)
                    .map((p) => ({ id: p.id, name: p.name, level: "province" as const }));
            case "municipality":
                return municityMeta
                    .filter((m) => m.name.toLowerCase().includes(q))
                    .slice(0, 12)
                    .map((m) => ({ id: m.id, name: m.name, level: "municipality" as const }));
        }
    }, [query, mapMode, regions, provinces, municityMeta]);

    function handleSelect(item: { id: number; name: string; level: MapMode }) {
        let division: Division | null = null;

        if (item.level === "region") {
            const r = regions.find((x) => x.id === item.id);
            if (r) division = { ...r, level: "region" };
        } else if (item.level === "province") {
            const p = provinces.find((x) => x.id === item.id);
            if (p) division = { ...p, level: "province" };
        } else {
            const withGeo = municities.find((x) => x.id === item.id);
            if (withGeo) division = municityToDivision(withGeo);
            else {
                const meta = municityMeta.find((x) => x.id === item.id);
                if (meta) division = municityMetaToDivision(meta, provinces);
            }
        }

        if (division) {
            onSelect(division);
            setQuery("");
            onClose();
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setQuery("");
                onClose();
            }}
            title={`Search ${mapMode === "municipality" ? "municipalities" : `${mapMode}s`}`}
        >
            <Input
                placeholder={`Search by ${mapMode} name…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />
            <div style={{ marginTop: 12, maxHeight: 300, overflowY: "auto" }}>
                {results.length === 0 && query.trim() && (
                    <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No results found.</p>
                )}
                {results.map((item) => (
                    <button
                        key={`${item.level}-${item.id}`}
                        type="button"
                        onClick={() => handleSelect(item)}
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "10px 12px",
                            border: "none",
                            borderBottom: "1px solid var(--border-light)",
                            background: "transparent",
                            textAlign: "left",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                            fontSize: 14,
                        }}
                    >
                        {item.name}
                    </button>
                ))}
            </div>
        </Modal>
    );
}
