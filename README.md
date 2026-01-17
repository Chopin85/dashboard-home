# Dashboard Docker

Smart home dashboard with Alexa Shopping List, Nextcloud calendar, and weather integration.

## Components

- **dashboard-web**: Nginx server for HTML/CSS (port 5500)
- **dashboard-proxy**: Node.js proxy for CORS and API aggregation (port 3030)
- **alexa-api**: Alexa Shopping List API (port 8800)

## Prerequisites

- Docker & Docker Compose
- Amazon account with Alexa
- Nextcloud account (for calendar)
- API key: OpenWeatherMap

## Setup

### 1. Configure environment variables

Copy the example file and fill with your values:

```bash
cp .env.example .env
```

Edit `.env` with:

- Nextcloud username and password
- Calendar URL
- OpenWeatherMap API key

### 2. Start containers

```bash
docker compose up --build -d
```

### 3. Authenticate with Alexa (first time)

```bash
cd Alexa-Shopping-List
source .venv/bin/activate
python -m src.auth.login
```

Follow the instructions to login with Amazon.

### 4. Access dashboard

Open browser at: `http://localhost:5500`

On remote server: `http://YOUR_SERVER_IP:5500`

## Alexa Cookie Update

Amazon cookies expire periodically. When the shopping list doesn't update:

```bash
cd Alexa-Shopping-List
source .venv/bin/activate
python -m src.auth.login
```

## File Structure

```
dashboard-docker/
├── docker-compose.yml
├── Dockerfile.proxy
├── Dockerfile.web
├── index.html
├── style.css
├── proxy-server.js
├── .env
├── .env.example
└── Alexa-Shopping-List/
    ├── docker-compose.yml
    ├── Dockerfile
    └── ...
```

## Ports

- 5500: Web dashboard
- 3030: Proxy server
- 8800: Alexa API

## Troubleshooting

**Empty shopping list?**

- Verify alexa-api is running: `docker compose logs alexa-api`
- Re-authenticate: `python -m src.auth.login`

**Calendar not loading?**

- Verify Nextcloud credentials in .env file
- Check logs: `docker compose logs dashboard-proxy`

**Weather/Stock not working?**
not working?\*\*

- Verify API keyonsole for errors
