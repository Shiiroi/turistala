import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { memo } from "react";
import MapEffect from "./MapEffect";

const POSITION = [14.5, 121.2]; // Rizal area

// Bounding box for the Philippines
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
      <MapEffect selectedTown={selectedTown} />

      {municipalities.map((town) => {
        const isSelected = selectedTown?.id === town.id;
        
        return (
          <GeoJSON 
            key={town.id} 
            data={town.geo_json} 
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