// index.ts — Backward-compatible re-export barrel for map geographic types.
// Re-exports division types from the map feature during migration away from the legacy types directory.

// Re-export map types for backward compatibility during migration
export type { ProvinceGeoJSON, MunicityGeoJSON, Region } from "../features/map/types";
