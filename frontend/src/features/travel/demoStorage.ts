import type { DemoTravelData } from "../types";

export const DEMO_STORAGE_KEY = "turistala_demo_v1";
// Demo /map without login — UX only; JWT + RLS protect real data
export const DEMO_MODE_KEY = "turistala_mode";
export const PENDING_IMPORT_KEY = "turistala_pending_import";
export const NEW_SIGNUP_KEY = "turistala_new_signup";
export const IMPORT_DISMISSED_KEY = "turistala_import_dismissed";
const IMPORT_DONE_PREFIX = "turistala_import_done_";

const EMPTY: DemoTravelData = {
    places: [],
    goals: [],
    visited: [],
    journals: [],
};

function readLocalJson<T>(key: string): T | null {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

// Migrate sessionStorage flags from pre-localStorage
function migrateLegacyImportFlags(): void {
    try {
        const pending = window.sessionStorage.getItem(PENDING_IMPORT_KEY);
        if (pending && !window.localStorage.getItem(PENDING_IMPORT_KEY)) {
            window.localStorage.setItem(PENDING_IMPORT_KEY, pending);
        }
        const newSignup = window.sessionStorage.getItem(NEW_SIGNUP_KEY);
        if (newSignup && !window.localStorage.getItem(NEW_SIGNUP_KEY)) {
            window.localStorage.setItem(NEW_SIGNUP_KEY, newSignup);
        }
        window.sessionStorage.removeItem(PENDING_IMPORT_KEY);
        window.sessionStorage.removeItem(NEW_SIGNUP_KEY);
    } catch {
        // ignore
    }
}

migrateLegacyImportFlags();

export function loadDemoData(): DemoTravelData {
    try {
        const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
        if (!raw) return { ...EMPTY };
        return JSON.parse(raw) as DemoTravelData;
    } catch {
        return { ...EMPTY };
    }
}

export function saveDemoData(data: DemoTravelData): void {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
}

export function exportDemoData(): DemoTravelData {
    return loadDemoData();
}

export function clearDemoData(): void {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
}

export function hasDemoData(): boolean {
    const data = loadDemoData();
    return (
        data.places.length > 0 ||
        data.goals.length > 0 ||
        data.visited.length > 0 ||
        data.journals.length > 0
    );
}

export function setDemoMode(): void {
    window.localStorage.setItem(DEMO_MODE_KEY, "demo");
}

export function clearDemoMode(): void {
    window.localStorage.removeItem(DEMO_MODE_KEY);
}

export function isDemoMode(): boolean {
    return window.localStorage.getItem(DEMO_MODE_KEY) === "demo";
}

export function setPendingImport(data: DemoTravelData): void {
    window.localStorage.setItem(PENDING_IMPORT_KEY, JSON.stringify(data));
}

export function getPendingImport(): DemoTravelData | null {
    return readLocalJson<DemoTravelData>(PENDING_IMPORT_KEY);
}

export function clearPendingImport(): void {
    window.localStorage.removeItem(PENDING_IMPORT_KEY);
}

export function markNewSignup(): void {
    window.localStorage.setItem(NEW_SIGNUP_KEY, "1");
}

export function isNewSignup(): boolean {
    return window.localStorage.getItem(NEW_SIGNUP_KEY) === "1";
}

export function clearNewSignup(): void {
    window.localStorage.removeItem(NEW_SIGNUP_KEY);
}

export function markImportDismissed(): void {
    window.localStorage.setItem(IMPORT_DISMISSED_KEY, "1");
}

export function clearImportDismissed(): void {
    window.localStorage.removeItem(IMPORT_DISMISSED_KEY);
}

export function isImportDismissed(): boolean {
    return window.localStorage.getItem(IMPORT_DISMISSED_KEY) === "1";
}

export function markImportDone(userId: string): void {
    window.localStorage.setItem(`${IMPORT_DONE_PREFIX}${userId}`, "1");
}

export function isImportDone(userId: string): boolean {
    return window.localStorage.getItem(`${IMPORT_DONE_PREFIX}${userId}`) === "1";
}

export function getDemoDataForImport(): DemoTravelData | null {
    const pending = getPendingImport();
    if (pending && (pending.places.length > 0 || pending.goals.length > 0 || pending.visited.length > 0 || pending.journals.length > 0)) {
        return pending;
    }
    if (hasDemoData()) return loadDemoData();
    return null;
}

export function shouldOfferDemoImport(userId?: string): boolean {
    if (!userId) return false;
    if (isImportDone(userId)) return false;
    if (isImportDismissed()) return false;
    return getDemoDataForImport() != null;
}

export function clearImportState(userId?: string): void {
    clearPendingImport();
    clearNewSignup();
    clearImportDismissed();
    clearDemoData();
    clearDemoMode();
    if (userId) markImportDone(userId);
}
