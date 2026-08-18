let ai;

const embeddingCache = new Map();

const embeddingStats = {
  hits: 0,
  misses: 0,
};

const getAI = async () => {
  if (!ai) {
    const { GoogleGenAI } = await import("@google/genai");

    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return ai;
};

const createDocumentText = (item) => {
  const title = item.title || "none";
  const description = item.description || "";

  const trimmedDescription = description.slice(0, 1200);

  return `title: ${title} | text: ${trimmedDescription}`;
};

const generateEmbeddings = async (documents) => {
  const aiClient = await getAI();

  const contents = documents.map((text) => ({
    parts: [{ text }],
  }));

  const response = await aiClient.models.embedContent({
    model: "gemini-embedding-2",
    contents,
    config: {
      outputDimensionality: 768,
    },
  });

  return response.embeddings.map((embedding) => embedding.values);
};

const generateCachedEmbeddings = async (documents, keys) => {
  const results = new Array(documents.length);
  const missingDocuments = [];
  const missingIndexes = [];

  documents.forEach((document, index) => {
    const cachedEmbedding = embeddingCache.get(keys[index]);

    if (cachedEmbedding) {
      embeddingStats.hits++;
      results[index] = cachedEmbedding;
    } else {
      embeddingStats.misses++;
      missingDocuments.push(document);
      missingIndexes.push(index);
    }
  });

  if (missingDocuments.length > 0) {
    const newEmbeddings = await generateEmbeddings(missingDocuments);

    newEmbeddings.forEach((embedding, index) => {
      const originalIndex = missingIndexes[index];
      const key = keys[originalIndex];

      embeddingCache.set(key, embedding);
      results[originalIndex] = embedding;
    });
  }

  return results;
};

const cosineSimilarity = (a, b) => {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

const keywordScore = (item, keyword) => {
  const queryWords = keyword.toLowerCase().split(/\s+/).filter(Boolean);

  const text = createDocumentText(item).toLowerCase();

  let score = 0;

  for (const word of queryWords) {
    if (text.includes(word)) {
      score++;
    }
  }

  return score;
};

const selectCandidates = (results, keyword, limit = 8) => {
  return results
    .map((item) => ({
      item,
      keywordScore: keywordScore(item, keyword),
    }))
    .sort((a, b) => b.keywordScore - a.keywordScore)
    .slice(0, limit)
    .map((entry) => entry.item);
};

module.exports = {
  createDocumentText,
  generateEmbeddings,
  generateCachedEmbeddings,
  cosineSimilarity,
  selectCandidates,
  embeddingStats,
};
