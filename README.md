# NASA Mission Intelligence

AI-powered NASA technology intelligence platform that retrieves relevant NASA technology sources, performs semantic search and reranking, and generates grounded answers using Google Gemini.

🔗 **Live Demo:** https://nasa-mission-intelligence.vercel.app/  
🔗 **GitHub:** https://github.com/HariPriya816141/nasa-mission-intelligence

---

## Overview

NASA Mission Intelligence is a full-stack AI application designed to make NASA technology and research information easier to explore through natural-language questions.

Instead of relying only on keyword-based search, the application combines NASA technology data with semantic embeddings, similarity scoring, Python-based reranking, and Gemini-powered response generation.

A user can ask a question such as:

> What NASA technologies are related to rocket propulsion?

The system retrieves relevant NASA technology sources, ranks them based on relevance, and generates a concise answer grounded in those sources.

---

## Key Features

- Natural-language querying of NASA technology data
- NASA API integration
- Semantic search using Gemini embeddings
- Cosine similarity-based relevance scoring
- Keyword-based candidate selection
- Python/FastAPI reranking service
- Retrieval-Augmented Generation (RAG)
- Source-grounded Gemini responses
- Retrieved source references and semantic relevance scores
- Pipeline performance metrics
- React-based responsive interface
- Cloud deployment using AWS EC2 and Vercel

---

## Architecture

```text
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │       Vercel        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Node.js / Express │
                    │       AWS EC2       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌───────────┐   ┌──────────────┐  ┌─────────────┐
        │ NASA API  │   │ Google Gemini │  │ Python /    │
        │           │   │              │  │ FastAPI     │
        │ Technology│   │ Embeddings + │  │ Reranking   │
        │ Data      │   │ Generation   │  │ Service     │
        └───────────┘   └──────────────┘  └─────────────┘
```

---

## RAG Pipeline

The application uses a multi-stage retrieval and generation pipeline.

### 1. NASA Data Retrieval

The Node.js backend retrieves NASA technology information through the NASA API.

### 2. Candidate Selection

Potentially relevant documents are narrowed using keyword-based candidate selection before semantic processing.

### 3. Embedding Generation

Gemini embeddings are generated for the selected documents and the user query.

### 4. Semantic Similarity

Cosine similarity is used to compare the query embedding with document embeddings and identify semantically relevant sources.

### 5. Python Reranking

Selected candidates are sent to a Python/FastAPI service for additional reranking.

### 6. Grounded Generation

The highest-ranked NASA sources are passed to Google Gemini as contextual information.

The generation process is instructed to:

- Use only the provided NASA sources
- Avoid unsupported claims
- Mention NASA reference IDs when making factual claims
- State when the available sources are insufficient
- Keep responses concise and structured

### 7. Response

The backend returns:

- Generated answer
- Retrieved NASA sources
- Source reference IDs
- Semantic relevance scores
- Pipeline performance metrics

The React frontend displays the resulting Mission Intelligence Report.

---

## Technology Stack

### Frontend

- React.js
- JavaScript
- React Markdown
- Vite
- CSS

### Backend

- Node.js
- Express.js
- REST APIs
- dotenv

### AI & Generative AI

- Google Gemini API
- Gemini Embeddings
- Retrieval-Augmented Generation (RAG)
- Semantic Search
- Cosine Similarity
- Prompt Engineering
- Large Language Models (LLMs)

### Python Service

- Python
- FastAPI
- Uvicorn
- NumPy

### Cloud & Deployment

- AWS EC2
- Elastic IP
- Vercel
- Git
- GitHub

---

## Performance Metrics

The application measures performance across different stages of the pipeline.

The frontend displays:

- NASA API latency
- Retrieval latency
- Python reranking latency
- Gemini generation latency

During testing, the highest-ranked retrieved sources achieved semantic relevance scores above 70%.

> Semantic relevance scores represent embedding similarity and should not be interpreted as model accuracy.

---

## Project Structure

```text
nasa-mission-intelligence/
│
├── client/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── server.js
│   ├── ragService.js
│   ├── retrievalService.js
│   ├── package.json
│   └── .env.example
│
├── python-service/
│   ├── app.py
│   ├── requirements.txt
│   └── ...
│
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js 20+
- pnpm
- Python 3.12+
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/HariPriya816141/nasa-mission-intelligence.git

cd nasa-mission-intelligence
```

---

### 2. Install JavaScript Dependencies

```bash
pnpm install
```

This installs the dependencies for the workspace projects.

---

### 3. Set Up the Python Environment

Create a Python virtual environment:

```bash
python3 -m venv python-service/venv
```

#### Windows

```bash
python-service\venv\Scripts\activate
```

#### Linux / macOS

```bash
source python-service/venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r python-service/requirements.txt
```

---

### 4. Configure Backend Environment Variables

Create:

```text
server/.env
```

Add:

```env
GEMINI_API_KEY=your_gemini_api_key
```

The Gemini API key must remain on the backend and should never be exposed through the React frontend.

---

### 5. Configure Frontend Environment Variables

Create:

```text
client/.env
```

For local development:

```env
VITE_API_URL=http://localhost:5000
```

For the deployed frontend, configure the production environment variable with the deployed backend URL.

---

### 6. Start the Python RAG Service

From the project root:

```bash
uvicorn python-service.app:app --host 0.0.0.0 --port 8000
```

The Python service runs on:

```text
http://localhost:8000
```

---

### 7. Start the Node.js Backend

Open another terminal:

```bash
cd server
node server.js
```

The Node.js API runs on:

```text
http://localhost:5000
```

---

### 8. Start the React Frontend

From the project root:

```bash
pnpm --filter client dev
```

Open the local Vite URL displayed in the terminal.

---

## Example Query

```text
What NASA technologies are related to rocket propulsion?
```

The application retrieves relevant NASA technology sources and generates a grounded response.

Example retrieved technologies include:

- Small Spacecraft Electric Propulsion (SSEP) Technology Suite
- One-Piece Liquid Rocket Thrust Chamber Assembly (TCA)

Each retrieved source includes a NASA reference ID and semantic relevance score.

---

## API

### Health Check

```http
GET /
```

Example response:

```json
{
  "message": "NASA Mission Intelligence API is running"
}
```

### Ask NASA

```http
GET /api/nasa/ask?question=<question>
```

Example:

```text
GET /api/nasa/ask?question=What NASA technologies are related to rocket propulsion?
```

The endpoint returns the generated answer along with retrieved sources and pipeline performance metrics.

Example response structure:

```json
{
  "success": true,
  "question": "What NASA technologies are related to rocket propulsion?",
  "answer": "...",
  "performance": {
    "nasaLatency": 817.92,
    "retrievalLatency": 1216.36,
    "pythonLatency": 0.45,
    "generationLatency": 24791.78
  },
  "sources": [
    {
      "reference": "LEW-TOPS-162",
      "title": "Small Spacecraft Electric Propulsion (SSEP) Technology Suite",
      "type": "patent",
      "semanticScore": 0.805
    }
  ]
}
```

---

## Deployment

### Frontend

The React frontend is deployed using Vercel.

**Live Application:**

https://nasa-mission-intelligence.vercel.app/

### Backend

The Node.js/Express backend and Python/FastAPI service are deployed on an AWS EC2 instance.

The EC2 instance uses an Elastic IP to provide a stable public address for backend communication.

### Deployment Architecture

```text
                    Internet
                       │
                       ▼
        ┌─────────────────────────────┐
        │        Vercel Frontend      │
        │        React + Vite         │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │           AWS EC2           │
        │                             │
        │  ┌───────────────────────┐  │
        │  │ Node.js / Express     │  │
        │  │ Port 5000             │  │
        │  └───────────┬───────────┘  │
        │              │              │
        │  ┌───────────▼───────────┐  │
        │  │ Python / FastAPI      │  │
        │  │ Port 8000             │  │
        │  └───────────────────────┘  │
        │                             │
        └─────────────────────────────┘
```

---

## Security

- API credentials are stored using environment variables.
- Gemini API keys are kept on the backend.
- Secrets should never be committed to GitHub.
- `.env` files should remain excluded through `.gitignore`.
- The repository should be checked for accidentally committed credentials before being shared publicly.

---

## Future Improvements

- HTTPS and reverse proxy using Nginx
- Persistent vector storage
- Authentication and user accounts
- Query and response history
- Improved embedding caching
- Background indexing of NASA technology datasets
- More advanced retrieval evaluation
- Production process management using systemd or Docker
- Improved observability and logging

---

## Author

**G Sai Hari Priya**

Full-Stack Software Developer

**Portfolio:**  
https://portfolio-three-dusky-82.vercel.app/

**GitHub:**  
https://github.com/HariPriya816141/

**LinkedIn:**  
https://www.linkedin.com/in/hari-priyaaa/

**LeetCode:**  
https://leetcode.com/u/Haripriya2410/