// One hue per region id — gym-badge style, not flag colors
const BADGE_PALETTE = [
    "#c0622f",
    "#2d6a4f",
    "#457b9d",
    "#e9c46a",
    "#9b2226",
    "#6a4c93",
    "#bc6c25",
    "#0077b6",
    "#588157",
    "#d4a373",
    "#5c4d7d",
    "#e76f51",
    "#264653",
    "#f4a261",
    "#2a9d8f",
    "#8338ec",
    "#fb8500",
    "#606c38",
];

export function divisionBadgeColor(id: number): string {
    return BADGE_PALETTE[id % BADGE_PALETTE.length];
}

// deprecated: use divisionBadgeColor
export const regionBadgeColor = divisionBadgeColor;

export function badgeTier(fraction: number): "locked" | "bronze" | "silver" | "gold" {
    if (fraction <= 0) return "locked";
    if (fraction < 0.34) return "bronze";
    if (fraction < 0.67) return "silver";
    return "gold";
}

export const TIER_RING: Record<ReturnType<typeof badgeTier>, string> = {
    locked: "#c8beb0",
    bronze: "#cd7f32",
    silver: "#a8a9ad",
    gold: "#d4af37",
};

const NAME_ABBREVS: Record<string, string> = {
    "National Capital Region (NCR)": "NCR",
    "Cordillera Administrative Region (CAR)": "CAR",
    "Region I (Ilocos Region)": "Region I",
    "Region II (Cagayan Valley)": "Region II",
    "Region III (Central Luzon)": "Region III",
    "Region IV-A (CALABARZON)": "Region IV-A",
    "MIMAROPA Region": "MIMAROPA",
    "Region V (Bicol Region)": "Region V",
    "Region VI (Western Visayas)": "Region VI",
    "Negros Island Region (NIR)": "NIR",
    "Region VII (Central Visayas)": "Region VII",
    "Region VIII (Eastern Visayas)": "Region VIII",
    "Region IX (Zamboanga Peninsula)": "Region IX",
    "Region X (Northern Mindanao)": "Region X",
    "Region XI (Davao Region)": "Region XI",
    "Region XII (SOCCSKSARGEN)": "Region XII",
    "Region XIII (Caraga)": "Region XIII",
    "Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)": "BARMM",
};

export function shortDivisionName(name: string): string {
    if (NAME_ABBREVS[name]) return NAME_ABBREVS[name];
    const leadingRegion = name.match(/^(Region [IVX\d]+(?:-[A-Z])?)/i);
    if (leadingRegion) return leadingRegion[1];
    const regionTag = name.match(/\((Region[^)]+)\)/i);
    if (regionTag) return regionTag[1];
    const withoutRegion = name.replace(" Region", "");
    if (withoutRegion.length <= 20) return withoutRegion;
    return withoutRegion.slice(0, 19) + "…";
}
