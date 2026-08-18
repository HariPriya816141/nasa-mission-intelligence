from fastapi import FastAPI
import numpy as np
import time

app = FastAPI()


@app.get("/")
def root():
    return {
        "message": "Python RAG service is running"
    }


@app.post("/rerank")
def rerank(data: dict):
    start = time.perf_counter()

    query_embedding = np.array(data["queryEmbedding"])
    documents = data["documents"]
    document_embeddings = data["documentEmbeddings"]

    results = []

    for index, document in enumerate(documents):
        document_embedding = np.array(document_embeddings[index])

        similarity = np.dot(
            query_embedding,
            document_embedding
        ) / (
            np.linalg.norm(query_embedding)
            * np.linalg.norm(document_embedding)
        )

        results.append({
            "index": index,
            "document": document,
            "score": float(similarity)
        })

    results.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    latency = (time.perf_counter() - start) * 1000

    return {
        "results": results,
        "latency": round(latency, 2),
        "candidatesEvaluated": len(documents)
    }