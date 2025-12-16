// src/components/Map.jsx
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // CRITICAL: Import CSS here

// Coordinates for Rizal, Philippines
const POSITION = [14.5, 121.2]; 

const Map = () => {
  return (
    <MapContainer 
      center={POSITION} 
      zoom={10} 
      scrollWheelZoom={true}
      className="leaflet-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};

export default Map;