# Weather Dashboard

An interactive weather dashboard that shows real-time weather information and temperature distribution across the globe.

## Features

- Interactive world map with temperature heat map
- Click anywhere to get local weather information
- Real-time weather data from OpenWeatherMap API
- Temperature visualization using heat map
- Responsive design
- Multi-language support for location names

## Technologies Used

- React
- Material-UI
- Leaflet for maps
- OpenWeatherMap API
- Axios for API requests

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd cursor_weather
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenWeatherMap API key:
```
REACT_APP_OPENWEATHER_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm start
```

## Environment Variables

- `REACT_APP_OPENWEATHER_API_KEY`: Your OpenWeatherMap API key (Required)

## Deployment

This project is deployed using Vercel. To deploy your own instance:

1. Sign up for a Vercel account
2. Install Vercel CLI: `npm i -g vercel`
3. Run `vercel` in the project directory
4. Set up your environment variables in the Vercel dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
