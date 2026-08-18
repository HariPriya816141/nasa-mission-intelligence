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
                    │      Vercel         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Node.js /         │
                    │   Express Server     │
                    │      AWS EC2        │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌───────────┐   ┌──────────────┐  ┌─────────────┐
        │ NASA API  │   │ Gemini        │  │ Python /    │
        │           │   │ Embeddings    │  │ FastAPI     │
        │ Technology│   │ + Generation  │  │ Reranking   │
        │ Data      │   │               │  │ Service     │
        └───────────┘   └──────────────┘  └─────────────┘