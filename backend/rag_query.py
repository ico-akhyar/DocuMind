# rag_query.py
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Tuple
from datetime import datetime
from llm_service import llm_service

# Initialize components
client = chromadb.PersistentClient(path="chroma_db")
collection = client.get_collection("documents")
model = SentenceTransformer("all-MiniLM-L6-v2")

def get_relevant_chunks(query: str, user_id: str, session_id: str = None, n_results: int = 5):
    """
    Retrieve relevant chunks from ChromaDB with user and session filtering
    """
    print(f"🔍 Searching for user: {user_id}, session: {session_id}")
    
    # Enhance query for better retrieval
    enhanced_query = query
    query_lower = query.lower()
    
    if "rag" in query_lower:
        enhanced_query = query + " retrieval augmented generation systems models documents context"
    elif "ml" in query_lower or "machine learning" in query_lower:
        enhanced_query = query + " machine learning AI artificial intelligence algorithms"
    elif "ai" in query_lower or "artificial intelligence" in query_lower:
        enhanced_query = query + " artificial intelligence AI machine learning deep learning"
    
    print(f"🎯 Enhanced query: {enhanced_query}")
    
    # Generate query embedding
    query_embedding = model.encode([enhanced_query]).tolist()[0]
    
    # Build filter
    where_filter = {"user_id": user_id}
    if session_id:
        where_filter = {
            "$and": [
                {"user_id": user_id},
                {"session_id": session_id}
            ]
        }
    
    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter,
            include=["metadatas", "documents", "distances"]
        )
        
        print(f"📊 Found {len(results['documents'][0]) if results and results['documents'] else 0} results")
        
        # Debug: Show what we found
        if results and results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                similarity = 1 / (1 + results['distances'][0][i]) if results['distances'] else 0.8
                print(f"   📄 Result {i+1} (score: {similarity:.3f}): {doc[:100]}...")
        
        return results
    except Exception as e:
        print(f"❌ Error querying ChromaDB: {e}")
        return None

def query_rag(query: str, user_id: str, session_id: str = None) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Main RAG query function with user-based document isolation
    """
    print(f"🧠 Querying RAG for user {user_id}, session {session_id}")
    print(f"❓ Question: {query}")
    
    # Get relevant chunks with proper filtering
    results = get_relevant_chunks(query, user_id, session_id)
    
    if not results or not results['documents'] or not results['documents'][0]:
        return "No relevant information found in your documents. Please try a different query or upload more documents.", []
    
    # Prepare sources and chunks for response
    sources = []
    relevant_chunks = []
    
    for i, doc in enumerate(results['documents'][0]):
        metadata = results['metadatas'][0][i]
        relevant_chunks.append(doc)
        
        # Calculate similarity score
        if results['distances'] and i < len(results['distances'][0]):
            distance = results['distances'][0][i]
            similarity_score = 1 / (1 + distance)
        else:
            similarity_score = 0.8
        
        sources.append({
            "filename": metadata.get("filename", "Unknown"),
            "page": metadata.get("page", 1),
            "chunk_id": metadata.get("chunk_id", 0),
            "content_preview": doc[:150] + "..." if len(doc) > 150 else doc,
            "similarity_score": round(similarity_score, 3),
            "session_id": metadata.get("session_id", "public")
        })
    
    # Sort sources by similarity score (highest first)
    sources.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    # Generate answer using LLM service
    answer = llm_service.generate_answer(query, relevant_chunks)
    
    return answer, sources

# Utility function for cleanup
def cleanup_expired_data():
    """
    Clean up expired session data from ChromaDB
    """
    try:
        now = datetime.now()
        
        # Get all documents with expiration
        all_docs = collection.get()
        
        expired_ids = []
        for i, metadata in enumerate(all_docs['metadatas']):
            expires_at_str = metadata.get('expires_at')
            if expires_at_str:
                try:
                    expires_at = datetime.fromisoformat(expires_at_str)
                    if now > expires_at:
                        expired_ids.append(all_docs['ids'][i])
                except ValueError:
                    continue  # Skip if date format is invalid
        
        if expired_ids:
            print(f"🧹 Cleaning up {len(expired_ids)} expired documents")
            collection.delete(ids=expired_ids)
            
    except Exception as e:
        print(f"Error cleaning expired data: {e}")