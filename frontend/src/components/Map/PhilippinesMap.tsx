// Leaflet map for Philippine administrative divisions.

import { useMemo, useState, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from "react-leaflet";
import L from "leaflet";
import type { Feature, Geometry } from "geojson";
import { cn } from "../../lib/cn";

const PH_CENTER: [number, number] = [12.8797, 121.774];
const PH_ZOOM = 6;

type MapMode = "region" | "province" | "municipality";

const MODE_STYLES: Record<MapMode, { color: string; fillColor: string }> = {
    region: { color: "#e53e3e", fillColor: "#fc8181" },
    province: { color: "#2b6cb0", fillColor: "#3182ce" },
    municipality: { color: "#38a169", fillColor: "#68d391" },
};

const BASE_STYLE = (mode: MapMode): L.PathOptions => ({
    color: MODE_STYLES[mode].color,
    weight: 0.8,
    fillColor: MODE_STYLES[mode].fillColor,
    fillOpacity: 0.15,
    renderer: L.canvas(),
});

const HOVER_STYLE: L.PathOptions = {
    weight: 2,
    fillOpacity: 0.35,
};

interface GeoEntity {
    id: number | string;
    name: string;
    geometry: Geometry;
}

interface PhilippinesMapProps {
    provinces?: GeoEntity[];
    regions?: GeoEntity[];
    municities?: GeoEntity[];
    defaultMode?: MapMode;
}

// React component rendering PhilippinesMap.
export function PhilippinesMap({ provinces = [], regions = [], municities = [], defaultMode = "province" }: PhilippinesMapProps) {
    const [mode, setMode] = useState<MapMode>(defaultMode);

    const currentData = useMemo(() => {
        let entities: GeoEntity[] = [];
        switch (mode) {
            case "region":
                entities = regions as GeoEntity[];
                break;
            case "province":
                entities = provinces;
                break;
            case "municipality":
                entities = municities;
                break;
        }
        return {
            type: "FeatureCollection" as const,
            features: entities.map((e) => ({
                type: "Feature" as const,
                properties: { name: e.name, mode },
                geometry: e.geometry,
            })),
        };
    }, [mode, provinces, regions, municities]);

    const onEachFeature = useCallback(
        (feature: Feature, layer: L.GeoJSON) => {
            const name = feature.properties?.name as string;
            if (name) {
                layer.bindTooltip(name, { sticky: true, direction: "top" });
            }
            layer.on("mouseover", () => layer.setStyle(HOVER_STYLE));
            layer.on("mouseout", () => layer.setStyle(BASE_STYLE(mode)));
            layer.on("click", () => console.log(`[${mode}] Clicked:`, name));
        },
        [mode],
    );

    const modes: MapMode[] = ["region", "province", "municipality"];

    return (
        <div className="relative h-full min-h-[500px] w-full">
            <div className="absolute left-2.5 top-2.5 z-[1000] flex gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                {modes.map((m) => {
                    const isActive = mode === m;
                    const modeColor = MODE_STYLES[m].color;
                    return (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={cn(
                                "cursor-pointer rounded px-3 py-1 capitalize",
                                isActive ? "border-2 font-semibold text-white" : "border border-gray-300 bg-white font-normal text-gray-700",
                            )}
                            style={
                                isActive
                                    ? { borderColor: modeColor, background: modeColor }
                                    : undefined
                            }
                        >
                            {m}
                        </button>
                    );
                })}
            </div>

            <MapContainer
                center={PH_CENTER}
                zoom={PH_ZOOM}
                zoomControl={false}
                className="h-full w-full"
                scrollWheelZoom={true}
                preferCanvas={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ZoomControl position="bottomright" />
                <GeoJSON
                    key={`${mode}-${currentData.features.length}`}
                    data={currentData}
                    pathOptions={BASE_STYLE(mode)}
                    onEachFeature={onEachFeature}
                />
            </MapContainer>
        </div>
    );
}
