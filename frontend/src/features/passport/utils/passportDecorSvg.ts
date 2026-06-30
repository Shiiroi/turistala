// SVG decoration fragments for passport PNG export.

export function planeIconSvg(x: number, y: number, size: number): string {
    const s = size / 24;
    return `<g transform="translate(${x},${y}) scale(${s})"><g transform="rotate(-45 11 11)"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#c0622f" fill-opacity="0.85"/></g></g>`;
}

 /**
  * Performs operations for stylizedSunSvg in passportDecorSvg.ts.
  * @param cx - Parameter representing cx.
  * @param cy - Parameter representing cy.
  * @param size - Parameter representing size.
  * @param groupOpacity - Parameter representing groupOpacity.
  * @returns Value or promise returned by stylizedSunSvg.
 */
export function stylizedSunSvg(cx: number, cy: number, size: number, groupOpacity = 0.25): string {
    const rays = Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const x1 = cx + Math.cos(angle) * (size * 0.16);
        const y1 = cy + Math.sin(angle) * (size * 0.16);
        const x2 = cx + Math.cos(angle) * (size * 0.44);
        const y2 = cy + Math.sin(angle) * (size * 0.44);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c0622f" stroke-width="3" stroke-linecap="round" opacity="0.22"/>`;
    }).join("");
    const r = size * 0.14;
    const r2 = size * 0.085;
    return `<g opacity="${groupOpacity}">${rays}<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e9a319" opacity="0.28"/><circle cx="${cx}" cy="${cy}" r="${r2}" fill="#c0622f" opacity="0.35"/></g>`;
}

 /**
  * Performs operations for coverDecorSvg in passportDecorSvg.ts.
  * @param width - Parameter representing width.
  * @param headerH - Parameter representing headerH.
  * @returns Value or promise returned by coverDecorSvg.
 */
export function coverDecorSvg(width: number, headerH: number): string {
    return `
  <defs>
    <pattern id="diagHatch" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(-45)">
      <rect width="10" height="10" fill="transparent"/>
      <line x1="0" y1="0" x2="0" y2="10" stroke="#c0622f" stroke-width="1" opacity="0.08"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="${width}" height="${headerH}" fill="url(#diagHatch)"/>
  <line x1="16" y1="${headerH}" x2="${width - 16}" y2="${headerH}" stroke="#c8beb0" stroke-width="1" stroke-dasharray="4 4"/>`;
}
