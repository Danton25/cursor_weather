import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import WeatherDashboard from './components/WeatherDashboard';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WeatherDashboard />
    </ThemeProvider>
  );
}

export default App;
