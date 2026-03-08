import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { memo } from "react";
import MapEffect from "./MapEffect";

const POSITION = [14.5, 121.2];

/**
 * Geographic bounding box coordinates for the Philippines.
 * Configured as [Southwest Corner, Northeast Corner].
 */
const PH_BOUNDS = [
    [4.5, 116.0],
    [21.5, 127.5],
];

/**
 * Standard vector layer styling configuration.
 * Persisted outside of the component to prevent reconciliation resets.
 */
const DEFAULT_STYLE = {
    fillColor: "#4ECDC4",
    fillOpacity: 0.2,
    color: "#ffffff",
    weight: 1,
};

const HOVER_STYLE = {
    fillOpacity: 0.8,
    weight: 3,
    fillColor: "#FF6B6B",
};

const SELECTED_STYLE = {
    fillOpacity: 0.6,
    weight: 2,
    fillColor: "#FFD93D",
    color: "#ffffff",
};

/**
 * Calculates a dynamic tint derived from a base hexadecimal color and a magnitude ratio.
 * Shifts RGB matrices linearly towards white corresponding to a [0.0 - 1.0] scale.
 *
 * @param {string} hexColor - The originating base color code.
 * @param {number} factor - Completion ratio determining color weight (0 to 1).
 * @returns {string} The transformed RGB color string.
 */
const getTintedColor = (hexColor, factor) => {
    factor = Math.max(0, Math.min(1, factor));
    const hex = (hexColor || "#ec4899").replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const colorIntensity = 0.2 + factor * 0.8;

    const mixedR = Math.round(255 + colorIntensity * (r - 255));
    const mixedG = Math.round(255 + colorIntensity * (g - 255));
    const mixedB = Math.round(255 + colorIntensity * (b - 255));

    return `#${mixedR.toString(16).padStart(2, "0")}${mixedG.toString(16).padStart(2, "0")}${mixedB.toString(16).padStart(2, "0")}`;
};

/**
 * Map Component
 *
 * Renders an interactive Leaflet map displaying Philippine municipalities as GeoJSON polygons.
 * Handles user interactions (hover, click) and visual feedback through styling changes.
 *
 * @param {Array} municipalities - Array of municipality objects with geo_json geometry
 * @param {Function} onHover - Callback fired on mouse hover, receives municipality name
 * @param {Function} onSelect - Callback fired on click, receives municipality object or null
 * @param {Object} selectedTown - Currently selected municipality object
 */
const Map = ({
    municipalities,
    onHover,
    onSelect,
    selectedTown,
    baseColor,
    municipalityStats,
    mapMode = "municity",
}) => {
    return (
        <MapContainer
            center={POSITION}
            zoom={10}
            minZoom={5}
            maxZoom={18}
            maxBounds={PH_BOUNDS}
            maxBoundsViscosity={1.0}
            scrollWheelZoom={true}
            className="leaflet-container"
            style={{ background: "transparent" }}
        >
            <MapEffect selectedTown={selectedTown} />

            {municipalities.map((town) => {
                const isSelected = selectedTown?.id === town.id;

                let geoData = town.geo_json;
                if (typeof geoData === "string") {
                    try {
                        geoData = JSON.parse(geoData);
                    } catch (e) {
                        /* catch failure */
                    }
                }

                const townStats = municipalityStats?.[town.id];
                let customStyle = { ...DEFAULT_STYLE };

                if (townStats && townStats.total > 0) {
                    const percentage = townStats.visited / townStats.total;
                    customStyle = {
                        ...DEFAULT_STYLE,
                        fillColor: getTintedColor(baseColor, percentage),
                        fillOpacity: 0.8, // keep basic opacity solid since color drives intensity
                        weight: 2,
                        color: "#ffffff",
                    };
                }

                const currentStyle = isSelected ? SELECTED_STYLE : customStyle;

                return (
                    <GeoJSON
                        key={`${mapMode}-${town.id}-${baseColor}-${townStats?.visited}`}
                        data={geoData}
                        style={currentStyle}
                        eventHandlers={{
                            mouseover: (e) => {
                                const layer = e.target;
                                layer.setStyle(HOVER_STYLE);
                                onHover(town.name);
                            },
                            mouseout: (e) => {
                                const layer = e.target;
                                layer.setStyle(currentStyle);
                                onHover(null);
                            },
                            click: () => {
                                onSelect?.(isSelected ? null : town);
                            },
                        }}
                    />
                );
            })}
        </MapContainer>
    );
};

export default memo(Map);
