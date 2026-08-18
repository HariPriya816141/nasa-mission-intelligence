let ai;

const getAI = async () => {
  if (!ai) {
    const { GoogleGenAI } = await import("@google/genai");

    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return ai;
};

const buildContext = (results) => {
  return results
    .map(
      (item, index) => `
SOURCE ${index + 1}
Reference: ${item.reference}
Title: ${item.title}
Type: ${item.type}
Description: ${(item.description || "").slice(0, 700)}
`,
    )
    .join("\n--------------------\n");
};

const generateAnswer = async (question, results) => {
  const aiClient = await getAI();

  const context = buildContext(results);

  const prompt = `
You are NASA Mission Intelligence.

Answer the user's question using ONLY the NASA sources below.

Rules:
- Use only information supported by the sources.
- Do not invent facts.
- Mention NASA reference IDs when making factual claims.
- If the sources are insufficient, say so.
- Keep the answer concise and structured.

QUESTION:
${question}

NASA SOURCES:
${context}
`;

  const start = performance.now();

  const response = await aiClient.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  const latency = performance.now() - start;

  return {
    answer: response.text,
    latency: Number(latency.toFixed(2)),
  };
};

module.exports = {
  buildContext,
  generateAnswer,
};
