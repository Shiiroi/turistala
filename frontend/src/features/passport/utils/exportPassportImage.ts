// exportPassportImage.ts — SVG builders and PNG export for passport assets.

import type { Geometry } from "geojson";
import type { PassportProgressLevel } from "../types";
import type { PassportProgressLine } from "../components/PassportBooklet";
import { coverDecorSvg, planeIconSvg, stylizedSunSvg } from "./passportDecorSvg";
import { geometriesToSvgPath, geometryToSvgPath } from "./geometryToSvgPath";
import {
    badgeTier,
    divisionBadgeColor,
    shortDivisionName,
    TIER_RING,
} from "./regionBadgeTheme";
import { metricUnitLabel, stampProgressLabel } from "./computePassportStats";

export interface ExportStamp {
    id: number;
    name: string;
    fraction: number;
    visited: number;
    total: number;
    geometry?: Geometry;
}

export interface ExportCoverOptions {
    progressLines: PassportProgressLine[];
    username: string;
    initials: string;
    avatarUrl?: string | null;
    passportId: string;
    phGeometries: Geometry[];
    width?: number;
}

function escapeXml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function progressLineSvg(line: PassportProgressLine, y: number, leftX: number, rightX: number): string {
    const fraction = `${line.visited} / ${line.total} ${line.label}`;
    const pct =
        line.pct != null
            ? `<text x="${rightX}" y="${y}" text-anchor="end" font-family="sans-serif" font-size="11" font-weight="600" fill="#c0622f">${line.pct}%</text>`
            : "";
    return `<text x="${leftX}" y="${y}" text-anchor="start" font-family="sans-serif" font-size="11" fill="#6b5c4a">${escapeXml(fraction)}</text>${pct}`;
}

function renderPhOutline(x: number, y: number, size: number, geometries: Geometry[]): string {
    const pathD = geometriesToSvgPath(geometries, size, 2);
    if (!pathD) return "";
    return `<g transform="translate(${x},${y})"><path d="${pathD}" fill="#c0622f" fill-opacity="0.35" stroke="#c0622f" stroke-width="0.75" stroke-opacity="0.55"/></g>`;
}

export function buildPassportCoverSvg(options: ExportCoverOptions): string {
    const { progressLines, username, initials, avatarUrl, passportId, phGeometries, width = 400 } =
        options;
    const headerH = 72;
    const lineCount = Math.max(progressLines.length, 1);
    const bearerMinH = Math.max(100, 40 + lineCount * 16);
    const height = headerH + bearerMinH + 16;
    const phSize = 52;
    const phX = width - phSize - 20;
    const phY = 10;
    const avatarSize = 56;
    const bearerH = height - headerH;
    const avatarY = headerH + (bearerH - avatarSize) / 2;
    const colSplit = 200;
    const progressLeftX = colSplit + 16;
    const progressRightX = width - 16;
    const progressBlockH = lineCount * 16;
    const progressStartY = headerH + (bearerH - progressBlockH) / 2 + 12;
    const sunSize = 64;
    const sunX = width - sunSize / 2 - 8;
    const sunY = headerH + bearerH / 2;

    const progressSvg = progressLines
        .map((line, i) =>
            progressLineSvg(line, progressStartY + i * 16, progressLeftX, progressRightX),
        )
        .join("\n  ");

    const avatarBlock = avatarUrl
        ? `<image href="${avatarUrl}" x="20" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" clip-path="url(#avatarClip)"/>`
        : `<text x="${20 + avatarSize / 2}" y="${avatarY + avatarSize / 2 + 6}" text-anchor="middle" font-family="Georgia,serif" font-size="20" font-weight="bold" fill="#c0622f">${escapeXml(initials)}</text>`;

    const nameY = avatarY + 18;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <clipPath id="avatarClip"><rect x="20" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" rx="8"/></clipPath>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#faf4e8"/><stop offset="45%" stop-color="#ede3d2"/><stop offset="100%" stop-color="#e5d9c5"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" rx="12"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="none" stroke="#c8beb0" stroke-width="2" rx="12"/>
  ${coverDecorSvg(width, headerH)}
  ${planeIconSvg(20, 14, 22)}
  <text x="50" y="26" font-family="Georgia,serif" font-size="11" font-weight="bold" fill="#c0622f" letter-spacing="3">TURISTALA</text>
  <text x="50" y="40" font-family="monospace" font-size="9" fill="#6b5c4a" letter-spacing="2">TRAVELER PASS</text>
  <text x="50" y="54" font-family="monospace" font-size="8" fill="#9a8b78">Doc. ${escapeXml(passportId)}</text>
  ${renderPhOutline(phX, phY, phSize, phGeometries)}
  <line x1="${colSplit}" y1="${headerH + 12}" x2="${colSplit}" y2="${height - 12}" stroke="#c8beb0" stroke-width="1" opacity="0.6"/>
  <rect x="20" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" fill="#faf4e8" stroke="#c8beb0" stroke-width="2" rx="8"/>
  ${avatarBlock}
  <text x="88" y="${nameY - 8}" font-family="monospace" font-size="9" fill="#9a8b78">BEARER</text>
  <text x="88" y="${nameY + 10}" font-family="Georgia,serif" font-size="18" font-weight="600" fill="#2c2416">${escapeXml(username)}</text>
  ${stylizedSunSvg(sunX, sunY, sunSize)}
  ${progressSvg}
</svg>`;
}

function stampStatText(stamp: ExportStamp): string {
    return stampProgressLabel({
        id: stamp.id,
        name: stamp.name,
        visited: stamp.visited,
        total: stamp.total,
        fraction: stamp.fraction,
    });
}

function renderStampBadgeSvg(
    stamp: ExportStamp,
    x: number,
    y: number,
    size: number,
): string {
    const tier = badgeTier(stamp.fraction);
    const accent = divisionBadgeColor(stamp.id);
    const ring = TIER_RING[tier];
    const inner = size - 16;
    const iconSize = Math.round(size * 0.5);
    const pathD = stamp.geometry ? geometryToSvgPath(stamp.geometry, iconSize, 3) : "";
    const dash =
        stamp.total > 0 ? Math.max(0.01, stamp.fraction) * Math.PI * (size - 8) : 0;
    const label = shortDivisionName(stamp.name);
    const labelY = size + 12;
    const stat = stampStatText(stamp);

    return `
    <g transform="translate(${x},${y})">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="none" stroke="#e8dfd0" stroke-width="3"/>
      ${stamp.total > 0 ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="none" stroke="${ring}" stroke-width="3"
        stroke-dasharray="${dash} ${Math.PI * (size - 8)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` : ""}
      <circle cx="${size / 2}" cy="${size / 2}" r="${inner / 2}" fill="url(#badgeGrad${stamp.id})" stroke="${ring}" stroke-width="2"/>
      ${pathD ? `<g transform="translate(${(size - iconSize) / 2},${(size - iconSize) / 2})"><path d="${pathD}" fill="${accent}" fill-opacity="${0.35 + stamp.fraction * 0.55}"/></g>` : ""}
      <text x="${size / 2}" y="${labelY}" text-anchor="middle" font-family="monospace" font-size="8" fill="#6b5c4a">${escapeXml(label)}</text>
      <text x="${size / 2}" y="${labelY + 10}" text-anchor="middle" font-family="monospace" font-size="7" fill="#9a8b78">${escapeXml(stat)}</text>
    </g>`;
}

export function buildSingleStampSvg(
    stamp: ExportStamp,
    badgeSize = 120,
): string {
    const padding = 24;
    const width = badgeSize + padding * 2;
    const height = badgeSize + 48;
    const gradient = `<radialGradient id="badgeGrad${stamp.id}" cx="30%" cy="25%"><stop offset="0%" stop-color="#fff8ee"/><stop offset="100%" stop-color="${divisionBadgeColor(stamp.id)}" stop-opacity="0.35"/></radialGradient>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    ${gradient}
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#faf4e8"/><stop offset="100%" stop-color="#e5d9c5"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" rx="12"/>
  ${renderStampBadgeSvg(stamp, padding, 8, badgeSize)}
</svg>`;
}

interface ExportStampSheetOptions {
    title: string;
    subtitle: string;
    stamps: ExportStamp[];
    cols?: number;
    badgeSize?: number;
    width?: number;
}

function buildStampSheetSvg(options: ExportStampSheetOptions): string {
    const { title, subtitle, stamps, cols = 5, badgeSize = 72, width = 520 } = options;
    const badgeGap = 16;
    const rowHeight = badgeSize + 28;
    const rows = Math.ceil(stamps.length / cols) || 1;
    const headerH = 56;
    const height = headerH + rows * rowHeight + 24;

    const gradients = stamps
        .map(
            (s) =>
                `<radialGradient id="badgeGrad${s.id}" cx="30%" cy="25%"><stop offset="0%" stop-color="#fff8ee"/><stop offset="100%" stop-color="${divisionBadgeColor(s.id)}" stop-opacity="0.35"/></radialGradient>`,
        )
        .join("");

    const badges = stamps
        .map((stamp, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const bx = 20 + col * (badgeSize + badgeGap);
            const by = headerH + row * rowHeight;
            return renderStampBadgeSvg(stamp, bx, by, badgeSize);
        })
        .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    ${gradients}
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#faf4e8"/><stop offset="100%" stop-color="#e5d9c5"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" rx="12"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="none" stroke="#c8beb0" stroke-width="2" rx="12"/>
  <text x="20" y="28" font-family="Georgia,serif" font-size="14" font-weight="bold" fill="#2c2416">${escapeXml(title)}</text>
  <text x="20" y="44" font-family="monospace" font-size="9" fill="#9a8b78">${escapeXml(subtitle)}</text>
  ${badges}
</svg>`;
}

export function buildRegionalStampsSvg(
    stamps: ExportStamp[],
    metric: PassportProgressLevel,
): string {
    return buildStampSheetSvg({
        title: "Regional Stamps",
        subtitle: `Progress by ${metricUnitLabel(metric)}`,
        stamps,
        cols: 4,
        badgeSize: 80,
        width: 400,
    });
}

export function buildProvincialStampsSvg(
    stamps: ExportStamp[],
    metric: PassportProgressLevel,
): string {
    return buildStampSheetSvg({
        title: "Provincial Stamps",
        subtitle: `Progress by ${metricUnitLabel(metric)}`,
        stamps,
        cols: 6,
        badgeSize: 64,
        width: 520,
    });
}

export async function downloadPassportPng(svg: string, filename: string): Promise<void> {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to render passport"));
        img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    await new Promise<void>((resolve, reject) => {
        canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
                reject(new Error("Failed to export PNG"));
                return;
            }
            const a = document.createElement("a");
            a.href = URL.createObjectURL(pngBlob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
            resolve();
        }, "image/png");
    });
}

export async function downloadSingleStampPng(
    stamp: ExportStamp,
    filename: string,
): Promise<void> {
    const svg = buildSingleStampSvg(stamp);
    await downloadPassportPng(svg, filename);
}
