import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * Controller component that handles camera movement when a town is selected.
 * Uses fitBounds with animation disabled to prevent blank tile flashing.
 */
const MapEffect = ({ selectedTown }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedTown?.geo_json) return;

    // Create a Leaflet GeoJSON layer just to calculate bounds
    const geoJsonLayer = L.geoJSON(selectedTown.geo_json);
    const bounds = geoJsonLayer.getBounds();

    // Short animation - fast enough to minimize blank tiles, but still smooth
    map.flyToBounds(bounds, {
      padding: [50, 50],
      maxZoom: 13,
      duration: 0.3, // Quick 300ms animation - best of both worlds
    });
  }, [selectedTown, map]);

  return null; // This component renders nothing
};

export default MapEffect;
