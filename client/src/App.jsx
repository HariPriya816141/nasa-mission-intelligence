import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [question, setQuestion] = useState(
    "What NASA technologies are related to rocket propulsion?",
  );

  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askNASA = async () => {
    if (!question.trim()) return;

    try {
      setLoading(true);
      setError("");
      setAnswer("");
      setSources([]);
      setPerformance(null);

      const response = await fetch(
        `http://localhost:5000/api/nasa/ask?question=${encodeURIComponent(
          question,
        )}`,
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Request failed");
      }

      setAnswer(data.answer);
      setSources(data.sources || []);
      setPerformance(data.performance || null);
    } catch (error) {
      console.error("RAG request failed:", error);
      setError(
        "NASA Intelligence is temporarily unavailable. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">NASA TECHNOLOGY INTELLIGENCE</p>

        <h1>Mission Intelligence</h1>

        <p className="subtitle">
          Ask questions about NASA technologies, research, and engineering
          solutions.
        </p>

        <div className="search-container">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                askNASA();
              }
            }}
            placeholder="Ask about NASA technologies..."
          />

          <button onClick={askNASA} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <main className="results-section">
          <div className="loading-state">
            <div className="loader"></div>

            <h2>Analyzing NASA technologies...</h2>

            <p>Searching NASA sources and generating a grounded response.</p>
          </div>
        </main>
      )}

      {!loading && answer && (
        <main className="results-section">
          <section className="answer-section">
            <div className="section-header">
              <p className="eyebrow">AI ANALYSIS</p>

              <h2>Mission Intelligence Report</h2>
            </div>

            <div className="answer-card">
              <div className="answer-text">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            </div>
          </section>

          {performance && (
            <section className="performance-section">
              <div className="section-header">
                <p className="eyebrow">PERFORMANCE</p>

                <h2>Pipeline Metrics</h2>
              </div>

              <div className="performance-grid">
                <div className="metric-card">
                  <span>NASA API</span>

                  <strong>
                    {(performance.nasaLatency / 1000).toFixed(2)}s
                  </strong>
                </div>

                <div className="metric-card">
                  <span>Retrieval</span>

                  <strong>
                    {(performance.retrievalLatency / 1000).toFixed(2)}s
                  </strong>
                </div>

                <div className="metric-card">
                  <span>Generation</span>

                  <strong>
                    {(performance.generationLatency / 1000).toFixed(2)}s
                  </strong>
                </div>
              </div>
            </section>
          )}

          {sources.length > 0 && (
            <section className="sources-section">
              <div className="section-header">
                <p className="eyebrow">RETRIEVED SOURCES</p>

                <h2>NASA Technologies</h2>

                <p>
                  Sources retrieved through semantic search and used to ground
                  the response.
                </p>
              </div>

              <div className="sources-list">
                {sources.map((source) => (
                  <article className="source-card" key={source.reference}>
                    <div className="source-top">
                      <span className="reference">{source.reference}</span>

                      <span className="score">
                        {(source.semanticScore * 100).toFixed(1)}%
                      </span>
                    </div>

                    <h3>{source.title}</h3>

                    <div className="source-footer">
                      <span>{source.type}</span>

                      <span>Semantic relevance</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
