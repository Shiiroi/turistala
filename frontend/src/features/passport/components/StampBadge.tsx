import type { Geometry } from "geojson";
import { Star } from "lucide-react";
import { cn } from "../../../lib/cn";
import { geometryToSvgPath } from "../utils/geometryToSvgPath";
import { stampProgressLabel } from "../utils/computePassportStats";
import {
    badgeTier,
    divisionBadgeColor,
    shortDivisionName,
    TIER_RING,
} from "../utils/regionBadgeTheme";

interface StampBadgeProps {
    id: number;
    name: string;
    fraction: number;
    visited: number;
    total: number;
    geometry?: Geometry;
    subtitle?: string;
    selected?: boolean;
    onClick?: () => void;
    size?: "sm" | "md" | "lg";
}

export function StampBadge({
    id,
    name,
    fraction,
    visited,
    total,
    geometry,
    subtitle,
    selected = false,
    onClick,
    size = "md",
}: StampBadgeProps) {
    const tier = badgeTier(fraction);
    const accent = divisionBadgeColor(id);
    const ring = TIER_RING[tier];
    const dim = size === "sm" ? 56 : size === "lg" ? 96 : 72;
    const svgInner = size === "sm" ? 32 : size === "lg" ? 48 : 40;
    const pathD = geometry ? geometryToSvgPath(geometry, svgInner, 3) : "";
    const label = shortDivisionName(name);
    const progressLabel = stampProgressLabel({ id, name, visited, total, fraction });
    const pct = total > 0 ? Math.round(fraction * 100) : 0;

    const Wrapper = onClick ? "button" : "div";

    return (
        <Wrapper
            type={onClick ? "button" : undefined}
            onClick={onClick}
            title={`${name}: ${progressLabel}`}
            className={cn(
                "group flex w-full flex-col items-center gap-1 text-center",
                onClick && "cursor-pointer",
            )}
        >
            <div
                className={cn(
                    "relative flex items-center justify-center rounded-full transition-transform duration-150",
                    onClick && "group-hover:scale-105",
                    selected && "ring-2 ring-accent ring-offset-2 ring-offset-parchment",
                )}
                style={{ width: dim, height: dim }}
            >
                <svg
                    className="absolute inset-0 -rotate-90"
                    width={dim}
                    height={dim}
                    viewBox={`0 0 ${dim} ${dim}`}
                >
                    <circle
                        cx={dim / 2}
                        cy={dim / 2}
                        r={dim / 2 - 3}
                        fill="none"
                        stroke="#e8dfd0"
                        strokeWidth={4}
                    />
                    {total > 0 && (
                        <circle
                            cx={dim / 2}
                            cy={dim / 2}
                            r={dim / 2 - 3}
                            fill="none"
                            stroke={ring}
                            strokeWidth={4}
                            strokeLinecap="round"
                            strokeDasharray={`${Math.max(0.01, fraction) * Math.PI * (dim - 6)} ${Math.PI * (dim - 6)}`}
                        />
                    )}
                </svg>

                <div
                    className={cn(
                        "relative flex items-center justify-center overflow-hidden",
                        "shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_2px_6px_rgba(44,36,22,0.12)]",
                        tier === "locked" ? "opacity-70" : "opacity-100",
                    )}
                    style={{
                        width: dim - 14,
                        height: dim - 14,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 30% 25%, #fff8ee, ${accent}22 55%, ${accent}44)`,
                        border: `2.5px solid ${ring}`,
                    }}
                >
                    {pathD ? (
                        <svg width={svgInner} height={svgInner} viewBox={`0 0 ${svgInner} ${svgInner}`}>
                            <path
                                d={pathD}
                                fill={accent}
                                fillOpacity={tier === "locked" ? 0.25 : 0.35 + fraction * 0.55}
                                stroke={accent}
                                strokeWidth={0.75}
                                strokeOpacity={0.6}
                            />
                        </svg>
                    ) : (
                        <span className="font-display text-xs font-bold text-accent/60">?</span>
                    )}
                    {tier === "gold" && (
                        <Star
                            size={10}
                            className="absolute -right-0.5 -top-0.5 fill-amber-400 text-amber-500"
                        />
                    )}
                </div>
            </div>
            <span
                className={cn(
                    "w-full px-0.5 font-mono text-[10px] leading-snug text-muted",
                    selected && "font-semibold text-accent",
                )}
            >
                {label}
            </span>
            <span className="font-mono text-[9px] text-muted/80">
                {visited}/{total} · {pct}%
            </span>
            {subtitle && (
                <span className="w-full px-0.5 font-mono text-[9px] leading-snug text-muted/70">
                    {subtitle}
                </span>
            )}
        </Wrapper>
    );
}
