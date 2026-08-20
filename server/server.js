require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const {
  createDocumentText,
  generateEmbeddings,
  generateCachedEmbeddings,
  cosineSimilarity,
  selectCandidates,
  embeddingStats,
} = require("./retrievalService");

const { generateAnswer } = require("./ragService");

const cache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
};
const app = express();

app.use(
  cors({
    origin: [
      "https://nasa-mission-intelligence.vercel.app",
      "http://localhost:5173",
    ],
  }),
);
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

  const hitRate = totalRequests === 0 ? 0 : (hits / totalRequests) * 100;

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
      `https://technology.nasa.gov/api/api/software/${encodeURIComponent(keyword)}`,
    );

    const patentResponse = await axios.get(
      `https://technology.nasa.gov/api/api/patent/${encodeURIComponent(keyword)}`,
    );

    const spinoffResponse = await axios.get(
      `https://technology.nasa.gov/api/api/spinoff/${encodeURIComponent(keyword)}`,
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
          `https://technology.nasa.gov/api/api/software/${encodeURIComponent(
            keyword,
          )}`,
        ),

        axios.get(
          `https://technology.nasa.gov/api/api/patent/${encodeURIComponent(
            keyword,
          )}`,
        ),

        axios.get(
          `https://technology.nasa.gov/api/api/spinoff/${encodeURIComponent(
            keyword,
          )}`,
        ),
      ]);

    const normalizeResults = (items, type) => {
      return (items || []).map((item) => ({
        id: item[0],
        reference: item[1],
        title: item[2]?.replace(/<[^>]*>/g, ""),
        description: item[3]?.replace(/<[^>]*>/g, ""),
        category: item[5],
        releaseType: item[6],
        center: item[10],
        relevanceScore: item[item.length - 1],
        type,
      }));
    };

    const software = normalizeResults(
      softwareResponse.data.results,
      "software",
    );

    const patents = normalizeResults(patentResponse.data.results, "patent");

    const spinoffs = normalizeResults(spinoffResponse.data.results, "spinoff");

    const results = [...software, ...patents, ...spinoffs];

    const totalLatency = performance.now() - start;

    res.json({
      success: true,
      mode: "concurrent",
      keyword,
      totalLatency: Number(totalLatency.toFixed(2)),

      counts: {
        software: software.length,
        patents: patents.length,
        spinoffs: spinoffs.length,
        total: results.length,
      },

      results,
    });
  } catch (error) {
    console.error("NASA concurrent error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch NASA sources",
    });
  }
});

app.get("/api/nasa/semantic-search", async (req, res) => {
  try {
    const { keyword = "rocket propulsion" } = req.query;

    const start = performance.now();

    // 1. Fetch NASA sources concurrently
    const [softwareResponse, patentResponse, spinoffResponse] =
      await Promise.all([
        axios.get(
          `https://technology.nasa.gov/api/api/software/${encodeURIComponent(
            keyword,
          )}`,
        ),

        axios.get(
          `https://technology.nasa.gov/api/api/patent/${encodeURIComponent(
            keyword,
          )}`,
        ),

        axios.get(
          `https://technology.nasa.gov/api/api/spinoff/${encodeURIComponent(
            keyword,
          )}`,
        ),
      ]);

    // 2. Normalize NASA data
    const normalizeResults = (items, type) => {
      return (items || []).map((item) => ({
        id: item[0],
        reference: item[1],
        title: item[2]?.replace(/<[^>]*>/g, ""),
        description: item[3]?.replace(/<[^>]*>/g, ""),
        category: item[5],
        releaseType: item[6],
        center: item[10],
        relevanceScore: item[item.length - 1],
        type,
      }));
    };

    const results = [
      ...normalizeResults(softwareResponse.data.results, "software"),
      ...normalizeResults(patentResponse.data.results, "patent"),
      ...normalizeResults(spinoffResponse.data.results, "spinoff"),
    ];

    // 3. Cheap first-stage retrieval
    const candidates = selectCandidates(results, keyword, 8);

    const documents = candidates.map(createDocumentText);

    const documentKeys = candidates.map((item) => `${item.type}:${item.id}`);

    const documentEmbeddings = await generateCachedEmbeddings(
      documents,
      documentKeys,
    );

    // 6. Embed the user's query
    const [queryEmbedding] = await generateEmbeddings([
      `task: search result | query: ${keyword}`,
    ]);

    // 7. Semantic ranking
    const rankedResults = candidates
      .map((result, index) => ({
        ...result,
        semanticScore: cosineSimilarity(
          queryEmbedding,
          documentEmbeddings[index],
        ),
      }))
      .sort((a, b) => b.semanticScore - a.semanticScore)
      .slice(0, 5);

    const latency = performance.now() - start;

    res.json({
      success: true,
      keyword,
      totalResults: results.length,
      candidatesEvaluated: candidates.length,
      retrievedResults: rankedResults.length,
      latency: Number(latency.toFixed(2)),
      results: rankedResults,
    });
  } catch (error) {
    console.error("Semantic search error:", error);

    res.status(500).json({
      success: false,
      message: "Semantic search failed",
      error: error.message,
    });
  }
});

app.get("/api/nasa/ask", async (req, res) => {
  try {
    const {
      question = "What NASA technologies are related to rocket propulsion?",
    } = req.query;

    // -----------------------------------------
    // 1. NASA API RETRIEVAL
    // -----------------------------------------

    const nasaStart = performance.now();

    const [softwareResponse, patentResponse, spinoffResponse] =
      await Promise.all([
        axios.get(
          `https://technology.nasa.gov/api/api/software/${encodeURIComponent(
            question,
          )}`,
        ),

        axios.get(
          `https://technology.nasa.gov/api/api/patent/${encodeURIComponent(
            question,
          )}`,
        ),

        axios.get(
          `https://technology.nasa.gov/api/api/spinoff/${encodeURIComponent(
            question,
          )}`,
        ),
      ]);

    const nasaLatency = performance.now() - nasaStart;

    // -----------------------------------------
    // 2. NORMALIZE NASA RESULTS
    // -----------------------------------------

    const normalizeResults = (items, type) => {
      return (items || []).map((item) => ({
        id: item[0],
        reference: item[1],
        title: item[2]?.replace(/<[^>]*>/g, ""),
        description: item[3]?.replace(/<[^>]*>/g, ""),
        category: item[5],
        releaseType: item[6],
        center: item[10],
        relevanceScore: item[item.length - 1],
        type,
      }));
    };

    const results = [
      ...normalizeResults(softwareResponse.data.results, "software"),
      ...normalizeResults(patentResponse.data.results, "patent"),
      ...normalizeResults(spinoffResponse.data.results, "spinoff"),
    ];

    // -----------------------------------------
    // 3. FIRST-STAGE RETRIEVAL
    // -----------------------------------------

    const candidates = selectCandidates(results, question, 8);

    // -----------------------------------------
    // 4. SEMANTIC RETRIEVAL
    // -----------------------------------------

    // Start measuring retrieval BEFORE
    // document embedding/cache lookup.
    const retrievalStart = performance.now();

    // Create document text
    const documents = candidates.map(createDocumentText);

    // Create unique cache keys
    const documentKeys = candidates.map((item) => `${item.type}:${item.id}`);

    // Get document embeddings
    // from cache or Gemini.
    const documentEmbeddings = await generateCachedEmbeddings(
      documents,
      documentKeys,
    );

    // Generate embedding for user's query
    const [queryEmbedding] = await generateEmbeddings([
      `task: search result | query: ${question}`,
    ]);

    const pythonServiceUrl =
      process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

    const pythonResponse = await axios.post(`${pythonServiceUrl}/rerank`, {
      queryEmbedding,
      documents,
      documentEmbeddings,
    });

    const rankedResults = pythonResponse.data.results
      .map((item) => ({
        ...candidates[item.index],
        semanticScore: item.score,
      }))
      .slice(0, 5);

    const pythonLatency = pythonResponse.data.latency;

    const retrievalLatency = performance.now() - retrievalStart;

    // -----------------------------------------
    // 5. GEMINI RAG GENERATION
    // -----------------------------------------

    const generationSources = rankedResults.slice(0, 3);

    const aiResult = await generateAnswer(question, generationSources);

    // -----------------------------------------
    // 6. RESPONSE
    // -----------------------------------------

    res.json({
      success: true,

      question,

      answer: aiResult.answer,

      performance: {
        nasaLatency: Number(nasaLatency.toFixed(2)),
        retrievalLatency: Number(retrievalLatency.toFixed(2)),
        pythonLatency,
        generationLatency: aiResult.latency,
      },

      sources: rankedResults.map((item) => ({
        reference: item.reference,
        title: item.title,
        type: item.type,
        semanticScore: Number(item.semanticScore.toFixed(3)),
      })),
    });
  } catch (error) {
    console.error("RAG error:", error);

    res.status(500).json({
      success: false,
      message: "RAG request failed",
      error: error.message,
    });
  }
});

app.get("/api/ai/test-embedding", async (req, res) => {
  try {
    const text =
      req.query.text || "Rocket propulsion systems for space exploration";

    const start = performance.now();

    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });

    const latency = performance.now() - start;

    res.json({
      success: true,
      text,
      latency: Number(latency.toFixed(2)),
      dimensions: response.embeddings[0].values.length,
      embedding: response.embeddings[0].values,
    });
  } catch (error) {
    console.error("Embedding error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate embedding",
      error: error.message,
    });
  }
});

app.get("/api/ai/embedding-stats", (req, res) => {
  const total = embeddingStats.hits + embeddingStats.misses;

  const hitRate = total === 0 ? 0 : (embeddingStats.hits / total) * 100;

  res.json({
    ...embeddingStats,
    totalLookups: total,
    hitRate: Number(hitRate.toFixed(2)),
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
