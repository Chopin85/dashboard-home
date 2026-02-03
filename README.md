# Dashboard Home

Modern cyberpunk-themed smart home dashboard with Nextcloud calendar, tasks, grocery list, weather, and stock market integration. Optimized for iPad 4 (1024x768) but works on any device.

## Features

- **Clock & Date**: Real-time clock with animated gradient display
- **Weather**: Current weather and 4-day forecast for Paris (OpenWeatherMap API)
- **Calendar**: Upcoming events from Nextcloud Calendar (CalDAV)
- **Stocks**: Real-time stock prices for LVMH and Campari (Yahoo Finance)
- **Tasks**: Incomplete tasks from Nextcloud Tasks (CalDAV)
- **Grocery List**: Shopping list from Nextcloud Tasks calendar "spesa" (CalDAV)

## Components

- **Web Dashboard**: Static HTML/CSS/JS with cyberpunk theme
- **Proxy Server**: Node.js server for CORS handling and API aggregation (port 3030)

## Prerequisites

- Node.js (v14 or higher)
- Nextcloud account with:
  - Personal calendar for events
  - Tasks calendar for tasks
  - "spesa" calendar for grocery list
- OpenWeatherMap API key (free tier)

## Setup

### 1. Clone and install

```bash
git clone <repository>
cd dashboard-home
```

### 2. Configure environment variables

Copy the example file and fill with your values:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Nextcloud
NEXTCLOUD_USERNAME=your_username
NEXTCLOUD_PASSWORD=your_app_password
CALENDAR_URL=https://your.nextcloud.com/remote.php/dav/calendars/username/personal/?export
TASKS_URL=https://your.nextcloud.com/remote.php/dav/calendars/username/personal
GROCERY_URL=https://your.nextcloud.com/remote.php/dav/calendars/username/spesa

# Weather
OPENWEATHER_API_KEY=your_api_key
```

**Note**: Replace `username` with your actual Nextcloud username in URLs.

### 3. Start the proxy server

```bash
node proxy-server.js
```

The proxy will start on port 3030 and log available endpoints.

### 4. Open the dashboard

Open `index.html` in your browser or serve it with any web server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080
```

Then navigate to `http://localhost:8080`

## Nextcloud Calendar Setup

### Create Task Calendars

1. Log into your Nextcloud instance
2. Go to **Tasks** app
3. Create two calendars:
   - **Personal**: For general tasks
   - **spesa**: For grocery/shopping list items
4. Add tasks to each calendar as needed

### Get Calendar URLs

The CalDAV URLs follow this pattern:

```
https://your.nextcloud.com/remote.php/dav/calendars/USERNAME/CALENDAR_NAME
```

Replace:

- `your.nextcloud.com` with your Nextcloud domain
- `USERNAME` with your username (all lowercase)
- `CALENDAR_NAME` with calendar name (e.g., `personal`, `spesa`)

## Stock Symbols

To change stock symbols, edit `index.html` around line 475:

```javascript
var stockSymbols = [
  { id: "lvmh", symbol: "MC:EPA", name: "LVMH Moët Hennessy" },
  { id: "campari", symbol: "CPR:MIL", name: "Davide Campari-Milano" },
];
```

Supported formats:

- European stocks: `SYMBOL:EPA` (Paris), `SYMBOL:MIL` (Milan)
- US stocks: Standard Yahoo Finance symbols

## Customization

### Change City for Weather

Edit `index.html` and search for `q=Paris` (appears twice):

```javascript
fetch("https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=...");
fetch("https://api.openweathermap.org/data/2.5/forecast?q=Paris&appid=...");
```

Replace `Paris` with your city name.

### Adjust Colors

Edit `style.css`:

- Tasks (blue): `rgba(125, 207, 255, ...)`
- Calendar (purple): `rgba(187, 154, 247, ...)`
- Grocery (purple): `rgba(149, 100, 255, ...)`
- Stocks positive (teal): `#73daca`
- Stocks negative (red): `#f7768e`

### Modify Layout

The dashboard uses CSS Grid with 3 columns and 2 rows:

- Row 1: Clock | Weather | Stocks
- Row 2: Calendar | Tasks | Grocery

Edit `.cyber-grid` in `style.css` to adjust layout.

## API Endpoints

The proxy server exposes these endpoints on port 3030:

- `GET /calendar` - Nextcloud calendar events (iCalendar format)
- `GET /tasks` - Incomplete tasks from Nextcloud Tasks
- `GET /grocery` - Grocery list items from "spesa" calendar
- `GET /stocks?symbol=MC:EPA` - Stock data from Yahoo Finance
- `GET /config` - Configuration (API keys) for frontend

## Auto-Refresh

Data is automatically refreshed:

- Clock: Every second
- Weather: Every 10 minutes
- Stocks: Every 5 minutes
- Calendar: Every 10 minutes
- Tasks: Every 5 minutes
- Grocery: Every 5 minutes

## Troubleshooting

**Tasks/Grocery not loading?**

- Verify CalDAV URLs are correct (use your username, not `user`)
- Check Nextcloud credentials in `.env`
- Ensure calendars exist in Nextcloud Tasks app
- Check proxy logs for 404 errors

**Weather not showing?**

- Verify OpenWeatherMap API key is valid
- Check browser console for errors
- Free tier has rate limits (60 calls/minute)

**Stocks not updating?**

- Yahoo Finance API is free but may have rate limits
- Verify stock symbols are correct
- Check browser console for errors

**Layout issues on iPad?**

- The dashboard is optimized for 1024x768 (iPad 4)
- Modern browsers required (Safari 9+, Chrome 49+)
- Disable browser zoom

## File Structure

```
dashboard-home/
├── index.html           # Main dashboard page
├── style.css            # Cyberpunk theme styles
├── proxy-server.js      # Node.js CORS proxy
├── .env                 # Your configuration (not in git)
├── .env.example         # Configuration template
├── README.md            # This file
└── docker-compose.yml   # Optional Docker setup
```

## Docker Deployment (Optional)

```bash
docker compose up --build -d
```

Access at `http://localhost:5500`

## License

MIT

**Weather/Stock not working?**
not working?\*\*

- Verify API keyonsole for errors
