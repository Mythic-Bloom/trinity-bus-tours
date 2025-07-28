
import React, { useEffect, useState } from 'react';

export const MapView = ({ route, currentLocation, userLocation, showRoute = true }) => {
  const mapRef = React.useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!window.L) {
      // Load Leaflet dynamically
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);

      const leafletJS = document.createElement('script');
      leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletJS.onload = initializeMap;
      document.head.appendChild(leafletJS);
    } else {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    if (mapRef.current && window.L && !map) {
      const newMap = window.L.map(mapRef.current).setView([-1.2864, 36.8172], 6);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(newMap);

      setMap(newMap);
    }
  };

  useEffect(() => {
    if (map && route) {
      // Clear existing markers and routes
      map.eachLayer((layer) => {
        if (layer instanceof window.L.Marker || layer instanceof window.L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // Add route waypoints
      if (showRoute && route.waypoints && route.waypoints.length > 0) {
        const polyline = window.L.polyline(route.waypoints, { color: 'blue', weight: 3 }).addTo(map);
        map.fitBounds(polyline.getBounds());
        
        // Origin marker
        window.L.marker(route.origin_coords)
          .addTo(map)
          .bindPopup(`Origin: ${route.origin}`)
          .openPopup();
        
        // Destination marker
        window.L.marker(route.destination_coords)
          .addTo(map)
          .bindPopup(`Destination: ${route.destination}`);
      }

      // Current bus location
      if (currentLocation && currentLocation.length === 2) {
        const busIcon = window.L.divIcon({
          html: '🚌',
          iconSize: [30, 30],
          className: 'bus-marker'
        });
        
        window.L.marker(currentLocation, { icon: busIcon })
          .addTo(map)
          .bindPopup('Current Bus Location');
      }

      // User location
      if (userLocation && userLocation.length === 2) {
        const userIcon = window.L.divIcon({
          html: '📍',
          iconSize: [25, 25],
          className: 'user-marker'
        });
        
        window.L.marker(userLocation, { icon: userIcon })
          .addTo(map)
          .bindPopup('Your Location');
      }
    }
  }, [map, route, currentLocation, userLocation, showRoute]);

  return <div ref={mapRef} className="w-full h-96 rounded-lg shadow-lg"></div>;
};
