const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Load .env file manually
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    }
  });
}

const PORT = 3030;

// Read configuration from environment variables
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME;
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD;
const CALENDAR_URL = process.env.CALENDAR_URL;
const TASKS_URL = process.env.TASKS_URL;
const GROCERY_URL = process.env.GROCERY_URL;
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
  } else if (req.url === "/tasks" && req.method === "GET") {
    // Endpoint for Nextcloud Tasks using CalDAV
    const auth =
      "Basic " +
      Buffer.from(NEXTCLOUD_USERNAME + ":" + NEXTCLOUD_PASSWORD).toString(
        "base64",
      );

    // Use REPORT method to query for incomplete tasks
    const requestBody = `<?xml version="1.0" encoding="UTF-8"?>
<c:calendar-query xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:d="DAV:">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VTODO">
        <c:prop-filter name="STATUS">
          <c:text-match negate-condition="yes">COMPLETED</c:text-match>
        </c:prop-filter>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

    const url = new URL(TASKS_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + (url.search || ""),
      method: "REPORT",
      headers: {
        Authorization: auth,
        "Content-Type": "application/xml",
        "Content-Length": Buffer.byteLength(requestBody),
        Depth: "1",
      },
    };

    const request = https.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        if (response.statusCode === 207) {
          // Parse CalDAV XML response and extract VTODO items
          try {
            const items = [];
            // Simple regex to extract SUMMARY from VTODO
            const summaryRegex = /SUMMARY:(.*?)(?:\r?\n(?![^\S\r\n]))/g;
            const statusRegex = /STATUS:COMPLETED/gi;

            let match;
            while ((match = summaryRegex.exec(data)) !== null) {
              const summary = match[1].trim();
              if (summary && !statusRegex.test(data)) {
                items.push(summary);
              }
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ items: items.slice(0, 15) }));
          } catch (parseError) {
            console.error("Error parsing tasks:", parseError);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Error parsing tasks" }));
          }
        } else {
          console.error("Nextcloud Tasks error:", response.statusCode);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Nextcloud Tasks error" }));
        }
      });
    });

    request.on("error", (err) => {
      console.error("Nextcloud Tasks error:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Error retrieving tasks" }));
    });

    request.write(requestBody);
    request.end();
  } else if (req.url === "/grocery" && req.method === "GET") {
    // Endpoint for Nextcloud Grocery List using CalDAV
    const auth =
      "Basic " +
      Buffer.from(NEXTCLOUD_USERNAME + ":" + NEXTCLOUD_PASSWORD).toString(
        "base64",
      );

    // Use REPORT method to query for incomplete tasks
    const requestBody = `<?xml version="1.0" encoding="UTF-8"?>
<c:calendar-query xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:d="DAV:">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VTODO">
        <c:prop-filter name="STATUS">
          <c:text-match negate-condition="yes">COMPLETED</c:text-match>
        </c:prop-filter>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

    const url = new URL(GROCERY_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + (url.search || ""),
      method: "REPORT",
      headers: {
        Authorization: auth,
        "Content-Type": "application/xml",
        "Content-Length": Buffer.byteLength(requestBody),
        Depth: "1",
      },
    };

    const request = https.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        if (response.statusCode === 207) {
          // Parse CalDAV XML response and extract VTODO items
          try {
            const items = [];
            // Simple regex to extract SUMMARY from VTODO
            const summaryRegex = /SUMMARY:(.*?)(?:\r?\n(?![^\S\r\n]))/g;
            const statusRegex = /STATUS:COMPLETED/gi;

            let match;
            while ((match = summaryRegex.exec(data)) !== null) {
              const summary = match[1].trim();
              if (summary && !statusRegex.test(data)) {
                items.push(summary);
              }
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ items: items.slice(0, 20) }));
          } catch (parseError) {
            console.error("Error parsing grocery list:", parseError);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Error parsing grocery list" }));
          }
        } else {
          console.error("Nextcloud Grocery error:", response.statusCode);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Nextcloud Grocery error" }));
        }
      });
    });

    request.on("error", (err) => {
      console.error("Nextcloud Grocery error:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Error retrieving grocery list" }));
    });

    request.write(requestBody);
    request.end();
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
  console.log(`Nextcloud tasks endpoint: http://localhost:${PORT}/tasks`);
  console.log(`Nextcloud grocery endpoint: http://localhost:${PORT}/grocery`);
});
