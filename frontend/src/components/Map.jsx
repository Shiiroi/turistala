import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { memo } from "react";
import MapEffect from "./MapEffect";

const POSITION = [14.5, 121.2]; // Rizal area

// Bounding box for the Philippines - restricts map panning to Philippine territory
const PH_BOUNDS = [
  [4.5, 116.0],   // Southwest corner
  [21.5, 127.5]   // Northeast corner
]; 

// Define styles outside component so they don't reset on re-renders
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
const Map = ({ municipalities, onHover, onSelect, selectedTown }) => {

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
      {/* MapEffect handles camera movement when towns are selected */}
      <MapEffect selectedTown={selectedTown} />

      {/* Render each municipality as an interactive GeoJSON layer */}
      {municipalities.map((town) => {
        const isSelected = selectedTown?.id === town.id;

        // Ensure geo_json is an object (some rows store it as a string)
        let geoData = town.geo_json;
        if (typeof geoData === 'string') {
          try { geoData = JSON.parse(geoData); } catch (e) { /* leave as-is */ }
        }

        return (
          <GeoJSON 
            key={town.id} 
            data={geoData} 
            style={isSelected ? SELECTED_STYLE : DEFAULT_STYLE} 
            eventHandlers={{
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle(HOVER_STYLE);
                onHover(town.name);
              },
              mouseout: (e) => {
                const layer = e.target;
                // Keep selected style if this town is selected
                layer.setStyle(isSelected ? SELECTED_STYLE : DEFAULT_STYLE);
                onHover(null);
              },
              click: () => {
                // Toggle selection: click again to deselect
                onSelect?.(isSelected ? null : town);
              }
            }}
          />
        );
      })}
    </MapContainer>
  );
};

export default memo(Map);