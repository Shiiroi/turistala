// types.ts — Shared types for homepage map selection and panel state.

import type { Geometry } from "geojson";
import type { Journal } from "../../travel/types";

export type MapMode = "region" | "province" | "municipality";

export interface DivisionBase {
    id: number;
    name: string;
    code: string;
    geometry?: Geometry;
}

export interface RegionDivision extends DivisionBase {
    level: "region";
}

export interface ProvinceDivision extends DivisionBase {
    level: "province";
    region_id: number;
}

export interface MunicityDivision extends DivisionBase {
    level: "municipality";
    province_id: number | null;
    region_id: number | null;
    type: "city" | "municipality";
}

export type Division = RegionDivision | ProvinceDivision | MunicityDivision;

export type PanelMode = "browse" | "journalDetail";

export type PanelBrowseTab = "explore" | "journals";

export interface JournalDetailContext {
    journalId: string;
    placeId: string;
    // Shown after create until travel query refetches
    pendingJournal?: Journal;
}

export function divisionLevelLabel(level: MapMode): string {
    switch (level) {
        case "region":
            return "Region";
        case "province":
            return "Province";
        case "municipality":
            return "Municipality";
    }
}
