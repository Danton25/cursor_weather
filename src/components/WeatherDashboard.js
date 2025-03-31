import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Thermostat,
  WaterDrop,
  Air,
  WbSunny,
  Cloud,
} from '@mui/icons-material';
import axios from 'axios';
import WorldMap from './WorldMap';

const WeatherDashboard = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || 'YOUR_API_KEY';

  const fetchWeather = async (location) => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`
      );
      setWeather(response.data);
      setCity(location);
    } catch (err) {
      setError('Failed to fetch weather data. Please check the city name and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (country) => {
    fetchWeather(country);
  };

  const WeatherCard = ({ title, value, icon }) => (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" component="div" ml={1}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <WorldMap onLocationSelect={handleLocationSelect} />
      
      {/* Weather Info Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '400px',
          maxWidth: '90vw',
          p: 3,
          zIndex: 1000,
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Enter City"
              variant="outlined"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchWeather(city)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }
              }}
            />
            <Button
              variant="contained"
              onClick={() => fetchWeather(city)}
              disabled={loading || !city}
              sx={{ minWidth: '120px' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {weather && (
            <Box>
              <Typography variant="h4" gutterBottom align="center">
                {weather.name}, {weather.sys.country}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <WeatherCard
                    title="Temperature"
                    value={`${Math.round(weather.main.temp)}°C`}
                    icon={<Thermostat color="primary" />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <WeatherCard
                    title="Humidity"
                    value={`${weather.main.humidity}%`}
                    icon={<WaterDrop color="primary" />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <WeatherCard
                    title="Wind Speed"
                    value={`${weather.wind.speed} m/s`}
                    icon={<Air color="primary" />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <WeatherCard
                    title="Weather"
                    value={weather.weather[0].main}
                    icon={weather.weather[0].main === 'Clear' ? <WbSunny color="primary" /> : <Cloud color="primary" />}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default WeatherDashboard; 