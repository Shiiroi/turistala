import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Feature, Geometry } from "geojson";
import type { Division, MapMode } from "../../homepage/types";
import type { MunicityGeoJSON, ProvinceGeoJSON, Region } from "../types";
import { MapScreenshotBridge } from "../hooks/useMapScreenshot";
import { cn } from "../../../lib/cn";
import type { MapExportCaptureProps } from "./MapExportCapture";
import { MapExportCapture } from "./MapExportCapture";

const PH_CENTER: [number, number] = [12.8797, 121.774];
const PH_ZOOM = 6;
/** SW / NE corners — keeps panning within the Philippine archipelago */
const PH_MAX_BOUNDS: L.LatLngBoundsExpression = [
    [3.5, 115.5],
    [22.0, 128.0],
];
const PH_BOUNDS = L.latLngBounds(PH_MAX_BOUNDS);

/** One shared canvas renderer for the entire layer — never create per feature */
const SHARED_RENDERER = L.canvas({ padding: 0.5 });

const BASE_FILL = "#ede3d2";
const DEFAULT_BORDER = "#a89880";
const HIGHLIGHT_BORDER = "#c0622f";
const BORDER_WEIGHT_BASE = 1.5;
const BORDER_WEIGHT_EMPHASIS = 2.75;
const EXPORT_BORDER_WEIGHT = 1.5;

interface TravelMapProps {
    provinces?: ProvinceGeoJSON[];
    regions?: Region[];
    municities?: MunicityGeoJSON[];
    mode: MapMode;
    selectedDivision: Division | null;
    heatmapColors: Map<number, string>;
    goalMunicityIds?: Set<number>;
    goalProvinceIds?: Set<number>;
    goalRegionIds?: Set<number>;
    onHover: (division: Division | null) => void;
    onSelect: (division: Division | null) => void;
    interactive?: boolean;
    showTiles?: boolean;
    exportCapture?: MapExportCaptureProps;
}

function divisionFromFeature(feature: Feature): Division | null {
    const p = feature.properties;
    if (!p || feature.geometry == null) return null;

    const base = {
        id: p.id as number,
        name: p.name as string,
        code: p.code as string,
        geometry: feature.geometry as Geometry,
    };

    switch (p.mode as MapMode) {
        case "region":
            return { ...base, level: "region" };
        case "province":
            return { ...base, level: "province", region_id: p.region_id as number };
        case "municipality":
            return {
                ...base,
                level: "municipality",
                province_id: p.province_id as number | null,
                region_id: p.region_id as number | null,
                type: p.type as "city" | "municipality",
            };
    }
}

function getBaseStyle(
    feature: Feature,
    heatmapColors: Map<number, string>,
    forExport = false,
): L.PathOptions {
    const id = feature.properties?.id as number;
    const fillColor = heatmapColors.get(id) ?? BASE_FILL;
    const visited = fillColor !== BASE_FILL;
    const color = forExport ? DEFAULT_BORDER : visited ? HIGHLIGHT_BORDER : DEFAULT_BORDER;

    if (forExport) {
        return {
            color: DEFAULT_BORDER,
            weight: EXPORT_BORDER_WEIGHT,
            fillColor,
            fillOpacity: 0.62,
        };
    }

    return {
        color,
        weight: BORDER_WEIGHT_BASE,
        fillColor,
        fillOpacity: 0.3,
    };
}

function getEmphasisStyle(base: L.PathOptions): L.PathOptions {
    return {
        ...base,
        weight: BORDER_WEIGHT_EMPHASIS,
        fillOpacity: 0.45,
    };
}

function boundsFromGeometry(geometry: Geometry): L.LatLngBounds | null {
    const temp = L.geoJSON(geometry as GeoJSON.GeoJsonObject);
    const bounds = temp.getBounds();
    temp.clearLayers();
    return bounds.isValid() ? bounds : null;
}

function FitBoundsOnSelect({ selectedDivision }: { selectedDivision: Division | null }) {
    const map = useMap();

    useEffect(() => {
        if (!selectedDivision?.geometry) return;
        const bounds = boundsFromGeometry(selectedDivision.geometry);
        if (bounds) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        }
    }, [selectedDivision, map]);

    return null;
}

function MapBackgroundClickHandler({ onBackgroundClick }: { onBackgroundClick: () => void }) {
    useMapEvents({
        click: () => {
            onBackgroundClick();
        },
    });
    return null;
}

/** Prevent zooming out past the point where the whole Philippines is visible */
function MapZoomLimits() {
    const map = useMap();

    useEffect(() => {
        map.setMaxBounds(PH_BOUNDS);

        const applyLimits = () => {
            // inside=false: max zoom where PH bounds fit the viewport; use padding so the
            // limit sits at "whole country in view", not a cropped tight crop
            const minZoom = map.getBoundsZoom(PH_BOUNDS, false, [48, 48]);
            map.setMinZoom(minZoom);
            if (map.getZoom() < minZoom) {
                map.setZoom(minZoom);
            }
        };

        applyLimits();
        map.on("resize", applyLimits);
        return () => {
            map.off("resize", applyLimits);
        };
    }, [map]);

    return null;
}

function TravelMapInner({
    provinces = [],
    regions = [],
    municities = [],
    mode,
    selectedDivision,
    heatmapColors,
    goalMunicityIds = new Set<number>(),
    goalProvinceIds = new Set<number>(),
    goalRegionIds = new Set<number>(),
    onHover,
    onSelect,
    interactive = true,
    showTiles = true,
    exportCapture,
}: TravelMapProps) {
    const layerMapRef = useRef<Map<number, L.Path>>(new Map());
    const selectedIdRef = useRef<number | null>(null);
    const hoveredIdRef = useRef<number | null>(null);
    const onHoverRef = useRef(onHover);
    const onSelectRef = useRef(onSelect);
    const heatmapColorsRef = useRef(heatmapColors);
    const goalIdsRef = useRef(goalMunicityIds);
    const goalProvinceIdsRef = useRef(goalProvinceIds);
    const goalRegionIdsRef = useRef(goalRegionIds);
    const modeRef = useRef(mode);
    const geoKeyRef = useRef("");
    const exportRendererRef = useRef<L.Canvas | null>(null);
    if (exportCapture && !exportRendererRef.current) {
        exportRendererRef.current = L.canvas({ padding: 0.5 });
    }
    const pathRenderer = exportCapture ? exportRendererRef.current! : SHARED_RENDERER;
    const forExport = !!exportCapture;

    onHoverRef.current = onHover;
    onSelectRef.current = onSelect;
    heatmapColorsRef.current = heatmapColors;
    goalIdsRef.current = goalMunicityIds;
    goalProvinceIdsRef.current = goalProvinceIds;
    goalRegionIdsRef.current = goalRegionIds;
    modeRef.current = mode;

    const currentData = useMemo(() => {
        let entities: Array<{
            id: number;
            name: string;
            code: string;
            geometry: Geometry;
            region_id?: number | null;
            province_id?: number | null;
            type?: string;
        }> = [];

        switch (mode) {
            case "region":
                entities = regions;
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
                properties: {
                    id: e.id,
                    name: e.name,
                    code: e.code,
                    mode,
                    region_id: e.region_id,
                    province_id: e.province_id,
                    type: e.type,
                },
                geometry: e.geometry,
            })),
        };
    }, [mode, provinces, regions, municities]);

    const geoKey = `${mode}-${currentData.features.length}`;

    // Clear registry BEFORE GeoJSON mounts new layers (useEffect ran too late and wiped the map)
    if (geoKeyRef.current !== geoKey) {
        layerMapRef.current.clear();
        hoveredIdRef.current = null;
        geoKeyRef.current = geoKey;
    }

    const selectedId = selectedDivision?.id ?? null;

    const styleForFeature = useCallback((feature?: Feature): L.PathOptions => {
        if (!feature) return { renderer: pathRenderer };
        return {
            ...getBaseStyle(feature, heatmapColorsRef.current, forExport),
            renderer: pathRenderer,
        };
    }, [pathRenderer, forExport]);

    const applyStyleToLayer = useCallback(
        (layer: L.Path, feature: Feature, variant: "base" | "hover" | "selected") => {
            const base = getBaseStyle(feature, heatmapColorsRef.current, forExport);
            const style =
                forExport || variant === "base"
                    ? base
                    : getEmphasisStyle(base);
            layer.setStyle(style);
            return style;
        },
        [forExport],
    );

    const repaintExportLayers = useCallback(() => {
        for (const [id, layer] of layerMapRef.current) {
            const feature = currentData.features.find((f) => f.properties.id === id);
            if (feature) applyStyleToLayer(layer, feature as Feature, "base");
        }
    }, [currentData.features, applyStyleToLayer]);

    // Update only the previously selected and newly selected layers
    useEffect(() => {
        const prevId = selectedIdRef.current;
        selectedIdRef.current = selectedId;

        if (prevId != null && prevId !== selectedId) {
            const prevLayer = layerMapRef.current.get(prevId);
            const prevFeature = currentData.features.find((f) => f.properties.id === prevId);
            if (prevLayer && prevFeature) {
                applyStyleToLayer(prevLayer, prevFeature as Feature, "base");
            }
        }

        if (selectedId != null) {
            const layer = layerMapRef.current.get(selectedId);
            const feature = currentData.features.find((f) => f.properties.id === selectedId);
            if (layer && feature) {
                applyStyleToLayer(layer, feature as Feature, "selected");
            }
        }
    }, [selectedId, currentData.features, applyStyleToLayer]);

    // Re-paint all polygons when heatmap palette changes (e.g. accent color picker)
    useEffect(() => {
        const selId = selectedIdRef.current;
        const hoverId = hoveredIdRef.current;

        for (const [id, layer] of layerMapRef.current) {
            const feature = currentData.features.find((f) => f.properties.id === id);
            if (!feature) continue;
            const variant =
                id === selId ? "selected" : id === hoverId ? "hover" : "base";
            applyStyleToLayer(layer, feature as Feature, variant);
        }
    }, [heatmapColors, goalMunicityIds, goalProvinceIds, goalRegionIds, currentData.features, applyStyleToLayer]);

    const onEachFeature = useCallback(
        (feature: Feature, layer: L.Layer) => {
            const id = feature.properties?.id as number;
            const pathLayer = layer as L.Path;
            layerMapRef.current.set(id, pathLayer);

            const name = feature.properties?.name as string;
            if (name && interactive) {
                pathLayer.bindTooltip(name, { sticky: false, direction: "top" });
            }

            const variant = selectedIdRef.current === id ? "selected" : "base";
            applyStyleToLayer(pathLayer, feature, variant);

            if (!interactive) return;

            pathLayer.on("mouseover", () => {
                const prevHoverId = hoveredIdRef.current;
                if (prevHoverId != null && prevHoverId !== id && prevHoverId !== selectedIdRef.current) {
                    const prevLayer = layerMapRef.current.get(prevHoverId);
                    const prevFeature = currentData.features.find(
                        (f) => f.properties.id === prevHoverId,
                    );
                    if (prevLayer && prevFeature) {
                        applyStyleToLayer(prevLayer, prevFeature as Feature, "base");
                    }
                }

                hoveredIdRef.current = id;

                if (selectedIdRef.current !== id) {
                    applyStyleToLayer(pathLayer, feature, "hover");
                }
                onHoverRef.current(divisionFromFeature(feature));
            });

            pathLayer.on("mouseout", () => {
                if (hoveredIdRef.current === id) {
                    hoveredIdRef.current = null;
                }

                const selId = selectedIdRef.current;
                if (selId === id) {
                    applyStyleToLayer(pathLayer, feature, "selected");
                } else {
                    applyStyleToLayer(pathLayer, feature, "base");
                }
                onHoverRef.current(null);
            });

            pathLayer.on("click", (e) => {
                L.DomEvent.stopPropagation(e);
                const division = divisionFromFeature(feature);
                if (!division) return;
                if (selectedIdRef.current === id) {
                    onSelectRef.current(null);
                } else {
                    onSelectRef.current(division);
                }
            });
        },
        [applyStyleToLayer, currentData.features, interactive],
    );

    return (
        <div
            className={cn(
                "relative h-full w-full",
                !exportCapture && "min-h-[500px]",
                !showTiles && !exportCapture && "bg-gradient-to-b from-[#c5dce8] via-[#b8cfd8] to-[#a8c4d4]",
                !showTiles && exportCapture && "bg-parchment",
            )}
        >
            <MapContainer
                center={PH_CENTER}
                zoom={PH_ZOOM}
                zoomControl={false}
                className={cn("h-full w-full", showTiles ? "bg-parchment" : "bg-transparent")}
                scrollWheelZoom={interactive}
                dragging={interactive}
                doubleClickZoom={interactive}
                touchZoom={interactive}
                preferCanvas={true}
                maxBounds={exportCapture ? undefined : PH_MAX_BOUNDS}
                maxBoundsViscosity={exportCapture ? undefined : 1}
                maxZoom={exportCapture ? 18 : 14}
            >
                {showTiles && (
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                )}
                {interactive && <ZoomControl position="bottomright" />}
                {!exportCapture && <MapZoomLimits />}
                {interactive && (
                    <MapBackgroundClickHandler onBackgroundClick={() => onSelectRef.current(null)} />
                )}
                {interactive && <FitBoundsOnSelect selectedDivision={selectedDivision} />}
                {interactive && <MapScreenshotBridge />}
                {exportCapture && (
                    <MapExportCapture {...exportCapture} onBeforeCapture={repaintExportLayers} />
                )}
                {currentData.features.length > 0 && (
                    <GeoJSON
                        key={geoKey}
                        data={currentData}
                        style={styleForFeature}
                        onEachFeature={onEachFeature}
                    />
                )}
            </MapContainer>
        </div>
    );
}

export const TravelMap = memo(TravelMapInner);
