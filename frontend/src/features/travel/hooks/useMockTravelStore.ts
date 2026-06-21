// useMockTravelStore.ts — Deprecated re-export of the demo travel store.
// Preserves the legacy useMockTravelStore name for callers migrating to useDemoTravelStore or useTravelStore.

// deprecated: use useDemoTravelStore or useTravelStore
export { useDemoTravelStore as useMockTravelStore } from "./useDemoTravelStore";
export type { TravelStore as MockTravelStore } from "../types";
