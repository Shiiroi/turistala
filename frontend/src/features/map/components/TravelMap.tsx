// TravelMap.tsx — Interactive Leaflet map of Philippine administrative divisions.

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Feature, Geometry } from "geojson";
import type { Division, MapMode } from "../../homepage/types";
import type { MunicityGeoJSON, ProvinceGeoJSON, Region } from "../types";
import { MapScreenshotBridge } from "../hooks/MapScreenshotBridge";
import { cn } from "../../../lib/cn";
import type { MapExportCaptureProps } from "./MapExportCapture";
import { MapExportCapture } from "./MapExportCapture";
import { MAP_SEA_BG_CLASS } from "../constants/seaBackground";

const PH_CENTER: [number, number] = [12.8797, 121.774];
const PH_ZOOM = 6;
// Pan bounds — Philippine archipelago
const PH_MAX_BOUNDS: L.LatLngBoundsExpression = [
    [3.5, 115.5],
    [22.0, 128.0],
];
const PH_BOUNDS = L.latLngBounds(PH_MAX_BOUNDS);

// Single canvas renderer for all features — don't create per feature
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
    hoverable?: boolean;
    showTiles?: boolean;
    fillContainer?: boolean;
    authPreview?: boolean;
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
    authPreview = false,
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

    if (authPreview) {
        return {
            color,
            weight: BORDER_WEIGHT_BASE,
            fillColor,
            fillOpacity: visited ? 0.38 : 0.32,
        };
    }

    return {
        color,
        weight: BORDER_WEIGHT_BASE,
        fillColor,
        fillOpacity: visited ? 0.52 : 0.48,
    };
}

function getEmphasisStyle(base: L.PathOptions, authPreview = false): L.PathOptions {
    return {
        ...base,
        weight: BORDER_WEIGHT_EMPHASIS,
        fillOpacity: authPreview ? 0.48 : 0.62,
    };
}

function boundsFromGeometry(geometry: Geometry): L.LatLngBounds | null {
    const temp = L.geoJSON(geometry as GeoJSON.GeoJsonObject);
    const bounds = temp.getBounds();
    temp.clearLayers();
    return bounds.isValid() ? bounds : null;
}

const MAP_FLY_DURATION = 0.4;

function FitBoundsOnSelect({ selectedDivision }: { selectedDivision: Division | null }) {
    const map = useMap();

    useEffect(() => {
        if (!selectedDivision?.geometry) return;
        const bounds = boundsFromGeometry(selectedDivision.geometry);
        if (!bounds) return;

        map.stop();
        map.flyToBounds(bounds, {
            padding: [40, 40],
            maxZoom: 12,
            duration: MAP_FLY_DURATION,
            easeLinearity: 0.35,
        });
    }, [selectedDivision?.id, selectedDivision?.level, selectedDivision?.geometry, map]);

    return null;
}

function MapBackgroundClickHandler({ onBackgroundClick }: { onBackgroundClick: () => void }) {
    useMapEvents({
        click: (e) => {
            const target = e.originalEvent.target as Element | null;
            if (target?.closest(".leaflet-interactive")) return;
            onBackgroundClick();
        },
    });
    return null;
}

// Floor zoom so the whole Philippines stays in view
function MapZoomLimits() {
    const map = useMap();

    useEffect(() => {
        map.setMaxBounds(PH_BOUNDS);

        const applyLimits = () => {
            // inside=false: max zoom where PH bounds fit the viewport; use padding so the
            // limit sits at "whole country in view", not a cropped tight crop
            const minZoom = map.getBoundsZoom(PH_BOUNDS, false, L.point(48, 48));
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
    hoverable: hoverableProp,
    showTiles = true,
    fillContainer = false,
    authPreview = false,
    exportCapture,
}: TravelMapProps) {
    const hoverable = hoverableProp ?? interactive;
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
    const exportRenderer = useMemo(
        () => (exportCapture ? L.canvas({ padding: 0.5 }) : null),
        [exportCapture],
    );
    const pathRenderer = exportRenderer ?? SHARED_RENDERER;
    const forExport = !!exportCapture;

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

    if (geoKeyRef.current !== geoKey) {
        geoKeyRef.current = geoKey;
        layerMapRef.current = new Map();
        hoveredIdRef.current = null;
    }

    onHoverRef.current = onHover;
    onSelectRef.current = onSelect;
    heatmapColorsRef.current = heatmapColors;
    goalIdsRef.current = goalMunicityIds;
    goalProvinceIdsRef.current = goalProvinceIds;
    goalRegionIdsRef.current = goalRegionIds;
    modeRef.current = mode;

    const selectedId = selectedDivision?.id ?? null;

    const styleForFeature = useCallback((feature?: Feature): L.PathOptions => {
        if (!feature) return { renderer: pathRenderer };
        return {
            ...getBaseStyle(feature, heatmapColors, forExport, authPreview),
            renderer: pathRenderer,
        };
    }, [pathRenderer, forExport, heatmapColors, authPreview]);

    const applyStyleToLayer = useCallback(
        (layer: L.Path, feature: Feature, variant: "base" | "hover" | "selected") => {
            const base = getBaseStyle(feature, heatmapColorsRef.current, forExport, authPreview);
            const style =
                forExport || variant === "base"
                    ? base
                    : getEmphasisStyle(base, authPreview);
            layer.setStyle(style);
            return style;
        },
        [forExport, authPreview],
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

    // Re-paint all polygons when heatmap colors change. react-leaflet also restyles via
    // styleForFeature, but this restores hover/selected emphasis after a palette update.
    useEffect(() => {
        const layers = layerMapRef.current;
        if (layers.size === 0) return;

        const featureById = new Map(
            currentData.features.map((f) => [f.properties.id as number, f as Feature]),
        );
        const selId = selectedIdRef.current;
        const hoverId = hoveredIdRef.current;

        for (const [id, layer] of layers) {
            const feature = featureById.get(id);
            if (!feature) continue;
            const variant =
                id === selId ? "selected" : id === hoverId ? "hover" : "base";
            applyStyleToLayer(layer, feature, variant);
        }
    }, [heatmapColors, currentData.features, applyStyleToLayer]);

    const onEachFeature = useCallback(
        (feature: Feature, layer: L.Layer) => {
            const id = feature.properties?.id as number;
            const pathLayer = layer as L.Path;
            layerMapRef.current.set(id, pathLayer);

            const name = feature.properties?.name as string;
            if (name && (hoverable || interactive)) {
                pathLayer.bindTooltip(name, { sticky: false, direction: "top" });
            }

            const variant = selectedIdRef.current === id ? "selected" : "base";
            applyStyleToLayer(pathLayer, feature, variant);

            if (hoverable) {
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
            }

            if (!interactive) return;

            pathLayer.on("click", (e) => {
                const domEvent = e as unknown as Event;
                L.DomEvent.preventDefault(domEvent);
                L.DomEvent.stopPropagation(domEvent);
                const division = divisionFromFeature(feature);
                if (!division) return;
                if (selectedIdRef.current === id) {
                    onSelectRef.current(null);
                } else {
                    onSelectRef.current(division);
                }
                const active = document.activeElement;
                if (active instanceof HTMLElement && active.closest(".leaflet-container")) {
                    active.blur();
                }
            });
        },
        [applyStyleToLayer, currentData.features, interactive, hoverable],
    );

    return (
        <div
            className={cn(
                "relative h-full w-full outline-none",
                !exportCapture && !fillContainer && "min-h-[500px]",
                !showTiles && !exportCapture && !authPreview && MAP_SEA_BG_CLASS,
                !showTiles && exportCapture && "bg-parchment",
                authPreview && "bg-transparent",
            )}
        >
            <MapContainer
                center={PH_CENTER}
                zoom={PH_ZOOM}
                zoomControl={false}
                className={cn(
                    "h-full w-full outline-none focus:outline-none",
                    showTiles ? "bg-parchment" : authPreview ? "bg-transparent" : MAP_SEA_BG_CLASS,
                )}
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
