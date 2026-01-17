const http = require("http");
const https = require("https");
require("dotenv").config();

const PORT = 3030;

// Read configuration from environment variables
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME;
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD;
const CALENDAR_URL = process.env.CALENDAR_URL;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/calendar" && req.method === "GET") {
    const auth =
      "Basic " +
      Buffer.from(NEXTCLOUD_USERNAME + ":" + NEXTCLOUD_PASSWORD).toString(
        "base64",
      );

    https
      .get(
        CALENDAR_URL,
        {
          headers: {
            Authorization: auth,
          },
        },
        (response) => {
          let data = "";
          response.on("data", (chunk) => {
            data += chunk;
          });
          response.on("end", () => {
            res.writeHead(200, { "Content-Type": "text/calendar" });
            res.end(data);
          });
        },
      )
      .on("error", (err) => {
        console.error("Calendar error:", err);
        res.writeHead(500);
        res.end("Error retrieving calendar");
      });
  } else if (req.url === "/alexa-shopping-list" && req.method === "GET") {
    // Endpoint for Alexa Shopping List API (alexa-api container)
    const options = {
      hostname: "alexa-api",
      port: 8800,
      path: "/items/all",
      method: "GET",
    };

    http
      .get(options, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          if (response.statusCode === 200) {
            const alexaItems = JSON.parse(data);
            // Filter only uncompleted items and extract "value" field
            const items = alexaItems
              .filter((item) => !item.completed)
              .map((item) => item.value)
              .slice(0, 10);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ items: items }));
          } else {
            console.error("Alexa API error:", response.statusCode, data);
            res.writeHead(response.statusCode);
            res.end(JSON.stringify({ error: "Alexa API error" }));
          }
        });
      })
      .on("error", (err) => {
        console.error("Alexa API connection error:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Alexa API connection error" }));
      });
  } else if (req.url.startsWith("/stocks") && req.method === "GET") {
    // Endpoint for Yahoo Finance Chart API
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const symbol = urlParams.searchParams.get("symbol");

    if (!symbol) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Missing symbol parameter" }));
      return;
    }

    // Convert Google Finance format to Yahoo format
    // MC:EPA -> MC.PA, CPR:MIL -> CPR.MI
    let tickerSymbol = symbol;
    if (symbol.includes(":EPA")) {
      tickerSymbol = symbol.replace(":EPA", ".PA");
    } else if (symbol.includes(":MIL")) {
      tickerSymbol = symbol.replace(":MIL", ".MI");
    }

    // Use Yahoo Finance Chart API endpoint
    const yahooApiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${tickerSymbol}?interval=1d&range=1d`;

    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    };

    https
      .get(yahooApiUrl, options, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            const json = JSON.parse(data);

            if (
              json.chart &&
              json.chart.result &&
              json.chart.result.length > 0
            ) {
              const result = json.chart.result[0];
              const meta = result.meta;

              const price = meta.regularMarketPrice;
              const previousClose =
                meta.chartPreviousClose || meta.previousClose;

              if (price && previousClose) {
                const changePercent =
                  ((price - previousClose) / previousClose) * 100;

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    price: price,
                    changePercent: changePercent,
                  }),
                );
              } else {
                console.error("Missing price data for " + tickerSymbol);
                res.writeHead(500);
                res.end(JSON.stringify({ error: "Missing price data" }));
              }
            } else {
              console.error(
                "No data from Yahoo Finance API for " + tickerSymbol,
              );
              res.writeHead(500);
              res.end(JSON.stringify({ error: "No stock data available" }));
            }
          } catch (error) {
            console.error("Error parsing Yahoo Finance API:", error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Error parsing stock data" }));
          }
        });
      })
      .on("error", (err) => {
        console.error("Yahoo Finance API error:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Error retrieving stock data" }));
      });
  } else if (req.url === "/config" && req.method === "GET") {
    // Endpoint to provide configurations to frontend
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        openWeatherApiKey: OPENWEATHER_API_KEY,
      }),
    );
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Calendar endpoint: http://localhost:${PORT}/calendar`);
  console.log(
    `Alexa shopping list endpoint: http://localhost:${PORT}/alexa-shopping-list`,
  );
});
