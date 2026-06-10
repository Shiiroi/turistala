import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Feature, Geometry } from "geojson";
import type { Division, MapMode } from "../../homepage/types";
import type { MunicityGeoJSON, ProvinceGeoJSON, Region } from "../types";

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

interface TravelMapProps {
    provinces?: ProvinceGeoJSON[];
    regions?: Region[];
    municities?: MunicityGeoJSON[];
    mode: MapMode;
    selectedDivision: Division | null;
    heatmapColors: Map<number, string>;
    goalMunicityIds?: Set<number>;
    onHover: (division: Division | null) => void;
    onSelect: (division: Division | null) => void;
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
    goalMunicityIds: Set<number>,
    mode: MapMode,
): L.PathOptions {
    const id = feature.properties?.id as number;
    const isGoal = mode === "municipality" && goalMunicityIds.has(id);

    return {
        color: isGoal ? "#c0622f" : "#a89880",
        weight: isGoal ? 2 : 0.8,
        fillColor: heatmapColors.get(id) ?? "#ede3d2",
        fillOpacity: 0.3,
        dashArray: isGoal ? "6 4" : undefined,
    };
}

function getSelectedStyle(base: L.PathOptions): L.PathOptions {
    return {
        ...base,
        color: "#c0622f",
        weight: 2.5,
        fillOpacity: 0.55,
    };
}

function getHoverStyle(base: L.PathOptions): L.PathOptions {
    return {
        ...base,
        weight: 2,
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
    onHover,
    onSelect,
}: TravelMapProps) {
    const layerMapRef = useRef<Map<number, L.Path>>(new Map());
    const selectedIdRef = useRef<number | null>(null);
    const hoveredIdRef = useRef<number | null>(null);
    const onHoverRef = useRef(onHover);
    const onSelectRef = useRef(onSelect);
    const heatmapColorsRef = useRef(heatmapColors);
    const goalIdsRef = useRef(goalMunicityIds);
    const modeRef = useRef(mode);
    const geoKeyRef = useRef("");

    onHoverRef.current = onHover;
    onSelectRef.current = onSelect;
    heatmapColorsRef.current = heatmapColors;
    goalIdsRef.current = goalMunicityIds;
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
        if (!feature) return { renderer: SHARED_RENDERER };
        return {
            ...getBaseStyle(
                feature,
                heatmapColorsRef.current,
                goalIdsRef.current,
                modeRef.current,
            ),
            renderer: SHARED_RENDERER,
        };
    }, []);

    const applyStyleToLayer = useCallback(
        (layer: L.Path, feature: Feature, variant: "base" | "hover" | "selected") => {
            const base = getBaseStyle(
                feature,
                heatmapColorsRef.current,
                goalIdsRef.current,
                modeRef.current,
            );
            const style =
                variant === "selected"
                    ? getSelectedStyle(base)
                    : variant === "hover"
                      ? getHoverStyle(base)
                      : base;
            layer.setStyle(style);
            return style;
        },
        [],
    );

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
    }, [heatmapColors, currentData.features, applyStyleToLayer]);

    const onEachFeature = useCallback(
        (feature: Feature, layer: L.Layer) => {
            const id = feature.properties?.id as number;
            const pathLayer = layer as L.Path;
            layerMapRef.current.set(id, pathLayer);

            const name = feature.properties?.name as string;
            if (name) {
                pathLayer.bindTooltip(name, { sticky: false, direction: "top" });
            }

            const variant = selectedIdRef.current === id ? "selected" : "base";
            applyStyleToLayer(pathLayer, feature, variant);

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
        [applyStyleToLayer, currentData.features],
    );

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 500 }}>
            <MapContainer
                center={PH_CENTER}
                zoom={PH_ZOOM}
                zoomControl={false}
                style={{ width: "100%", height: "100%", background: "var(--bg-parchment)" }}
                scrollWheelZoom={true}
                preferCanvas={true}
                maxBounds={PH_MAX_BOUNDS}
                maxBoundsViscosity={1}
                maxZoom={14}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ZoomControl position="bottomright" />
                <MapZoomLimits />
                <MapBackgroundClickHandler onBackgroundClick={() => onSelectRef.current(null)} />
                <FitBoundsOnSelect selectedDivision={selectedDivision} />
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
