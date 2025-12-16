import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { memo } from "react";

const POSITION = [14.5, 121.2]; // Rizal area

// Bounding box for the Philippines
const PH_BOUNDS = [
  [4.5, 116.0],   // Southwest corner
  [21.5, 127.5]   // Northeast corner
]; 

// 1. Define style outside component so it doesn't reset on re-renders
const DEFAULT_STYLE = { 
  fillColor: "#4ECDC4",
  fillOpacity: 0.2,     
  color: "#ffffff",        
  weight: 1,
};

const Map = ({ municipalities, onHover }) => {
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

      {municipalities.map((town) => (
        <GeoJSON 
          key={town.id} 
          data={town.geo_json} 
          style={DEFAULT_STYLE} 
          eventHandlers={{
            mouseover: (e) => {
              const layer = e.target;
              
              layer.setStyle({
                fillOpacity: 0.8, 
                weight: 3,        
                fillColor: "#FF6B6B" 
              });

              onHover(town.name);
            },
            mouseout: (e) => {
              const layer = e.target;
              
              // Reset to default
              layer.setStyle(DEFAULT_STYLE);

              onHover(null);
            }
          }}
        />
      ))}
    </MapContainer>
  );
};

// 3. Memoize to prevent re-rendering when parent state (hoveredTown) changes
export default memo(Map);