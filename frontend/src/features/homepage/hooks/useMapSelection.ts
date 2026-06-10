import { useCallback, useRef, useState } from "react";
import type { Division, MapMode } from "../types";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON, Region } from "../../map/types";

export function useMapSelection() {
    const [hoveredDivision, setHoveredDivision] = useState<Division | null>(null);
    const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
    const [mapMode, setMapMode] = useState<MapMode>("province");
    const hoverRafRef = useRef<number>(0);

    const selectDivision = useCallback((division: Division | null) => {
        setSelectedDivision(division);
    }, []);

    const hoverDivision = useCallback((division: Division | null) => {
        cancelAnimationFrame(hoverRafRef.current);
        hoverRafRef.current = requestAnimationFrame(() => {
            setHoveredDivision(division);
        });
    }, []);

    return {
        hoveredDivision,
        selectedDivision,
        mapMode,
        setMapMode,
        selectDivision,
        hoverDivision,
    };
}

export function regionToDivision(r: Region): Division {
    return {
        id: r.id,
        name: r.name,
        code: r.code,
        geometry: r.geometry,
        level: "region",
    };
}

export function provinceToDivision(p: ProvinceGeoJSON): Division {
    return {
        id: p.id,
        name: p.name,
        code: p.code,
        geometry: p.geometry,
        region_id: p.region_id,
        level: "province",
    };
}

export function municityToDivision(m: MunicityGeoJSON): Division {
    return {
        id: m.id,
        name: m.name,
        code: m.code,
        geometry: m.geometry,
        province_id: m.province_id,
        region_id: m.region_id,
        type: m.type,
        level: "municipality",
    };
}

export function municityMetaToDivision(m: MunicityMeta, provinces?: ProvinceGeoJSON[]): Division {
    const region_id =
        provinces && m.province_id
            ? (provinces.find((p) => p.id === m.province_id)?.region_id ?? m.region_id)
            : m.region_id;
    return {
        id: m.id,
        name: m.name,
        code: m.code,
        province_id: m.province_id,
        region_id,
        type: m.type,
        level: "municipality",
    };
}

export function findDivisionById(
    id: number,
    level: MapMode,
    regions: Region[],
    provinces: ProvinceGeoJSON[],
    municities: MunicityGeoJSON[],
): Division | null {
    switch (level) {
        case "region": {
            const r = regions.find((x) => x.id === id);
            return r ? regionToDivision(r) : null;
        }
        case "province": {
            const p = provinces.find((x) => x.id === id);
            return p ? provinceToDivision(p) : null;
        }
        case "municipality": {
            const m = municities.find((x) => x.id === id);
            return m ? municityToDivision(m) : null;
        }
    }
}
