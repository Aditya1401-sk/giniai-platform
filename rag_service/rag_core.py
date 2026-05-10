import os
from typing import List

class GiniRAG:
    """
    GiniLytics Retrieval-Augmented Generation (RAG) Core
    This engine allows the AI to search through your company documents.
    """
    def __init__(self):
        self.documents = [] # Placeholder for vector database
        print("GiniRAG Engine Initialized.")

    def add_document(self, content: str, metadata: dict = None):
        """Adds a document to the knowledge base."""
        self.documents.append({"content": content, "metadata": metadata})
        print(f"Added document to knowledge base. Total: {len(self.documents)}")

    def search(self, query: str, limit: int = 3) -> List[str]:
        """
        Context retrieval.
        Upgraded to detect general inquiries ('explain', 'summarize') and fallback to recent documents.
        """
        # 1. Try exact keyword matching first
        results = [doc["content"] for doc in self.documents if query.lower() in doc["content"].lower()]
        
        # 2. If it's a broad request ("explain this doc") or no exact matches, grab recent docs
        general_keywords = ["explain", "summarize", "what is", "read", "doc", "file", "this"]
        is_general = any(word in query.lower() for word in general_keywords)
        
        if not results and is_general:
            # Return the most recently uploaded documents (reverse order)
            results = [doc["content"] for doc in reversed(self.documents)]
            
        return results[:limit]

# Global instance
rag_engine = GiniRAG()
