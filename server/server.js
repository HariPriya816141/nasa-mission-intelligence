const express = require("express");
const cors = require("cors");
const axios = require("axios");

const cache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
};
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "NASA Mission Intelligence API is running",
  });
});

app.get("/api/nasa/search", async (req, res) => {
  try {
    const requestStart = performance.now();

    const { type = "software", keyword = "rocket" } = req.query;

    const cacheKey = `${type}:${keyword.toLowerCase().trim()}`;

    const cachedData = cache.get(cacheKey);

    // CACHE HIT
    if (cachedData) {
      cacheStats.hits++;

      const totalLatency = performance.now() - requestStart;

      return res.json({
        success: true,
        source: "cache",
        latency: Number(totalLatency.toFixed(2)),
        count: cachedData.length,
        results: cachedData,
      });
    }

    // CACHE MISS → CALL NASA
    cacheStats.misses++;
    const nasaStart = performance.now();

    const response = await axios.get(
      `https://technology.nasa.gov/api/api/${type}/${encodeURIComponent(
        keyword,
      )}`,
    );

    const nasaLatency = performance.now() - nasaStart;

    // DATA PREPROCESSING
    const results = response.data.results.map((item) => ({
      id: item[0],
      reference: item[1],
      title: item[2]?.replace(/<[^>]*>/g, ""),
      description: item[3]?.replace(/<[^>]*>/g, ""),
      category: item[5],
      releaseType: item[6],
      center: item[10],
      relevanceScore: item[item.length - 1],
    }));

    // STORE RESULT IN CACHE
    cache.set(cacheKey, results);

    const totalLatency = performance.now() - requestStart;

    res.json({
      success: true,
      source: "NASA API",
      nasaLatency: Number(nasaLatency.toFixed(2)),
      totalLatency: Number(totalLatency.toFixed(2)),
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("NASA API Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch NASA data",
    });
  }
});

app.get("/api/nasa/stats", (req, res) => {
  const { hits, misses } = cacheStats;

  const totalRequests = hits + misses;

  const hitRate =
    totalRequests === 0 ? 0 : (hits / totalRequests) * 100;

  res.json({
    hits,
    misses,
    totalRequests,
    hitRate: Number(hitRate.toFixed(2)),
    cachedEntries: cache.size,
  });
});

app.get("/api/nasa/search-all", async (req, res) => {
  try {
    const { keyword = "rocket" } = req.query;

    const start = performance.now();

    const softwareResponse = await axios.get(
      `https://technology.nasa.gov/api/api/software/${encodeURIComponent(keyword)}`
    );

    const patentResponse = await axios.get(
      `https://technology.nasa.gov/api/api/patent/${encodeURIComponent(keyword)}`
    );

    const spinoffResponse = await axios.get(
      `https://technology.nasa.gov/api/api/spinoff/${encodeURIComponent(keyword)}`
    );

    const totalLatency = performance.now() - start;

    res.json({
      success: true,
      mode: "sequential",
      totalLatency: Number(totalLatency.toFixed(2)),
      counts: {
        software: softwareResponse.data.count,
        patents: patentResponse.data.count,
        spinoffs: spinoffResponse.data.count,
      },
    });
  } catch (error) {
    console.error("NASA multi-source error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch NASA sources",
    });
  }
});

app.get("/api/nasa/search-all-concurrent", async (req, res) => {
  try {
    const { keyword = "rocket" } = req.query;

    const start = performance.now();

    const [softwareResponse, patentResponse, spinoffResponse] =
      await Promise.all([
        axios.get(
          `https://technology.nasa.gov/api/api/software/${encodeURIComponent(keyword)}`
        ),

        axios.get(
          `https://technology.nasa.gov/api/api/patent/${encodeURIComponent(keyword)}`
        ),

        axios.get(
          `https://technology.nasa.gov/api/api/spinoff/${encodeURIComponent(keyword)}`
        ),
      ]);

    const totalLatency = performance.now() - start;

    res.json({
      success: true,
      mode: "concurrent",
      totalLatency: Number(totalLatency.toFixed(2)),
      counts: {
        software: softwareResponse.data.count,
        patents: patentResponse.data.count,
        spinoffs: spinoffResponse.data.count,
      },
    });
  } catch (error) {
    console.error("NASA concurrent error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch NASA sources",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
