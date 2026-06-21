// mapExport.ts — Types for map export configuration, jobs, and JSON export payloads.

import type { DemoTravelData } from "../../travel/types";

export type MapExportLevel = "region" | "province" | "municipality";
export type MapExportFormat = "png" | "json";
export type MapExportProgressBy = "provinces" | "municipalities" | "places";

export type MapExportScope =
    | { kind: "all" }
    | { kind: "pick"; ids: number[] }
    | { kind: "inRegion"; regionId: number }
    | { kind: "inProvince"; provinceId: number };

export interface MapExportConfig {
    format: MapExportFormat;
    level: MapExportLevel;
    progressBy: MapExportProgressBy;
    scope: MapExportScope;
}

export interface TuristalaExportFile {
    version: 1;
    exported_at: string;
    scope: {
        level: MapExportLevel;
        progress_by: MapExportProgressBy;
        selection: MapExportScope;
    };
    data: DemoTravelData;
}

export interface ResolvedExportScope {
    entityIds: number[];
    municityIds: Set<number>;
    label: string;
    slug: string;
}

export interface ExportPngJob {
    level: MapExportLevel;
    progressBy: MapExportProgressBy;
    scope: MapExportScope;
    entityIds: number[];
    label: string;
    slug: string;
}
