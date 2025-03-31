import React, { useState, memo, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Paper, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import axios from 'axios';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Get user's locale or default to English
const getUserLocale = () => {
  try {
    const browserLocale = navigator.language || navigator.userLanguage;
    return browserLocale.split('-')[0]; // Get the language code (e.g., 'en' from 'en-US')
  } catch (error) {
    return 'en'; // Default to English if locale detection fails
  }
};

// Grid coordinates for temperature data (reduced density for better performance)
const generateGrid = () => {
  const grid = [];
  // Generate points with better coverage
  for (let lat = -60; lat <= 60; lat += 20) {
    for (let lon = -180; lon <= 180; lon += 20) {
      grid.push([lat, lon]);
    }
  }
  return grid;
};

function HeatmapLayer() {
  const map = useMap();
  const [loading, setLoading] = useState(true);
  const heatLayerRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchTemperatureData = async () => {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const grid = generateGrid();
      const data = [];
      
      try {
        // Fetch temperature data for grid points in batches
        const batchSize = 8;
        for (let i = 0; i < grid.length; i += batchSize) {
          if (!abortControllerRef.current) break;

          const batch = grid.slice(i, i + batchSize);
          const promises = batch.map(async ([lat, lon]) => {
            try {
              const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}&units=metric`,
                { signal: abortControllerRef.current.signal }
              );
              
              const temp = response.data.main.temp;
              // Convert temperature to a 0-1 scale where:
              // -20°C or below = 0 (cold)
              // 40°C or above = 1 (hot)
              const normalizedTemp = Math.min(Math.max((temp + 20) / 60, 0), 1);
              
              return {
                lat,
                lon,
                temp,
                value: normalizedTemp * 100 // Scale up for better heat map visibility
              };
            } catch (error) {
              if (error.name === 'AbortError') {
                throw error;
              }
              console.error('Error fetching temperature:', error);
              return null;
            }
          });

          const results = await Promise.all(promises);
          results.forEach(result => {
            if (result) {
              // Format for heat layer: [lat, lng, intensity]
              data.push([result.lat, result.lon, result.value]);
            }
          });

          // Delay between batches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Remove existing heat layer if it exists
        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current);
        }

        // Create and add new heat layer with better configuration
        heatLayerRef.current = L.heatLayer(data, {
          radius: 40,      // Size of each point
          blur: 20,        // Amount of blur
          maxZoom: 10,     // Max zoom level for heat map
          max: 100,        // Maximum intensity value
          minOpacity: 0.3, // Minimum opacity
          gradient: {      // Custom gradient for better temperature visualization
            0.0: '#2c7bb6', // Cold (blue)
            0.2: '#81b9df', // Cool (light blue)
            0.4: '#c7e8ad', // Cool-moderate (light green)
            0.6: '#ffed6f', // Moderate (yellow)
            0.8: '#f46d43', // Warm (orange)
            1.0: '#d73027'  // Hot (red)
          }
        }).addTo(map);

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching temperature data:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTemperatureData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map]);

  return loading ? (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 1000,
        backgroundColor: 'white',
        padding: 2,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <CircularProgress size={20} />
      <Typography variant="body2">Loading temperature data...</Typography>
    </Box>
  ) : null;
}

function LocationMarker({ position, onLocationSelect }) {
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const markerRef = useRef(null);
  const mapRef = useRef(null);

  const handleClick = async (e) => {
    const { lat, lng } = e.latlng;
    onLocationSelect({ lat, lng });
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}`
      );
      setLocationName(response.data.name);
    } catch (error) {
      console.error('Error fetching location name:', error);
      setLocationName('Unknown Location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on('click', handleClick);
      return () => {
        mapRef.current.off('click', handleClick);
      };
    }
  }, [handleClick]);

  useEffect(() => {
    if (position && mapRef.current) {
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
      }
      markerRef.current = L.marker(position).addTo(mapRef.current);
      markerRef.current.bindPopup(
        `<div style="text-align: center;">
          ${loading ? '<div>Loading...</div>' : locationName}
        </div>`
      );
    }
    return () => {
      if (markerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerRef.current);
      }
    };
  }, [position, loading, locationName]);

  return null;
}

const WorldMap = memo(({ onLocationSelect }) => {
  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0
    }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png"
        />
        <ZoomControl />
        <LocationMarker position={null} onLocationSelect={onLocationSelect} />
        <HeatmapLayer />
      </MapContainer>

      {/* Floating instruction box */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: 'auto',
          minWidth: 300,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          p: 2,
        }}
      >
        <Typography variant="h6" gutterBottom align="center">
          Click anywhere on the map
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          Select any location to check its weather
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
          Heat map shows global temperature distribution
        </Typography>
      </Paper>
    </Box>
  );
});

export default WorldMap; 