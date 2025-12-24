import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * MapEffect Component
 * 
 * A controller component that manages map camera behavior when a municipality is selected.
 * This component doesn't render any UI elements but controls the map's view programmatically.
 * 
 * @param {Object} selectedTown - The currently selected municipality object containing geo_json data
 * @param {Object} selectedTown.geo_json - GeoJSON geometry for the selected municipality
 */
const MapEffect = ({ selectedTown }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedTown?.geo_json) return;

    // Create a temporary Leaflet GeoJSON layer to calculate the bounds of the selected municipality
    // This allows us to zoom and pan the map to fit the entire selected area
    const geoJsonLayer = L.geoJSON(selectedTown.geo_json);
    const bounds = geoJsonLayer.getBounds();

    // Animate the map to fly to the calculated bounds with padding
    // - padding: [50, 50] adds 50px margin around the bounds
    // - maxZoom: 13 prevents zooming in too close for large areas
    // - duration: 0.3 provides a quick, smooth animation (300ms)
    map.flyToBounds(bounds, {
      padding: [50, 50],
      maxZoom: 13,
      duration: 0.3, // Quick 300ms animation - balances speed and smoothness
    });
  }, [selectedTown, map]);

  return null; // This component renders nothing - it's purely for side effects
};

export default MapEffect;
