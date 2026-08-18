import { useState } from "react";
import "./App.css";

function App() {
  const [keyword, setKeyword] = useState("rocket");
  const [results, setResults] = useState([]);
  const [source, setSource] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchNASA = async () => {
    if (!keyword.trim()) return;

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/nasa/search?type=software&keyword=${encodeURIComponent(
          keyword,
        )}`,
      );

      const data = await response.json();

      setResults(data.results);
      setSource(data.source);

      const responseLatency =
        data.source === "cache" ? data.latency : data.totalLatency;

      setLatency(responseLatency);
    } catch (error) {
      console.error("Search failed:", error);
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
          Explore NASA technologies, research, and engineering solutions.
        </p>

        <div className="search-container">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                searchNASA();
              }
            }}
            placeholder="Search NASA technologies..."
          />

          <button onClick={searchNASA} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </header>

      {results.length > 0 && (
        <main className="results-section">
          <div className="results-header">
            <div>
              <h2>NASA Technologies</h2>
              <p>{results.length} results found</p>
            </div>

            {latency !== null && (
              <div className="latency">
                {source === "cache" ? "Cached response" : "NASA API response"}
                <strong>{latency} ms</strong>
              </div>
            )}
          </div>

          <div className="results-list">
            {results.map((item) => (
              <article className="technology-card" key={item.id}>
                <div className="card-top">
                  <span className="reference">{item.reference}</span>

                  <span className="score">
                    Score {item.relevanceScore.toFixed(2)}
                  </span>
                </div>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <div className="card-footer">
                  <span>{item.category}</span>
                  <span>{item.releaseType}</span>
                </div>
              </article>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
