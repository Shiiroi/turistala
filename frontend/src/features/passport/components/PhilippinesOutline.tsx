// SVG silhouette of the Philippine archipelago.
// Renders merged region geometries as a compact filled outline for passport covers and other

import type { Geometry } from "geojson";
import { cn } from "../../../lib/cn";
import { geometriesToSvgPath } from "../utils/geometryToSvgPath";

interface PhilippinesOutlineProps {
    geometries: Geometry[];
    size?: number;
    className?: string;
    fill?: string;
}

export function PhilippinesOutline({
    geometries,
    size = 48,
    className,
    fill = "#c0622f",
}: PhilippinesOutlineProps) {
    const pathD = geometriesToSvgPath(geometries, size, 2);

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={cn("shrink-0", className)}
            aria-hidden
        >
            {pathD ? (
                <path
                    d={pathD}
                    fill={fill}
                    fillOpacity={0.35}
                    stroke={fill}
                    strokeWidth={0.75}
                    strokeOpacity={0.55}
                />
            ) : null}
        </svg>
    );
}
