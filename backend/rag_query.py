# rag_query.py
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from llm_service import llm_service
import os

# Initialize components
client = chromadb.PersistentClient(path="chroma_db")
collection = client.get_collection("documents")
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def get_relevant_chunks(query: str, user_id: str, session_id: str = None, n_results: int = 5):
    """
    Retrieve relevant chunks from ChromaDB with user and session filtering
    """
    print(f"🔍 Searching for user: {user_id}, session: {session_id}")
    
    # Generate query embedding
    query_embedding = model.encode([query]).tolist()[0]
    
    # Build filter - NEW LOGIC: Include both permanent and session documents
    if session_id:
        # For session queries: include both permanent docs AND current session docs
        where_filter = {
            "$or": [
                {"user_id": user_id, "is_permanent": True},  # All permanent docs
                {"user_id": user_id, "session_id": session_id}  # Current session docs
            ]
        }
    else:
        # For public queries: only permanent documents
        where_filter = {"user_id": user_id, "is_permanent": True}
    
    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter,
            include=["metadatas", "documents", "distances"]
        )
        
        print(f"📊 Found {len(results['documents'][0]) if results and results['documents'] else 0} results")
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
            "session_id": metadata.get("session_id", "public"),
            "document_type": "PERMANENT" if metadata.get("is_permanent") else "SESSION"
        })
    
    # Sort sources by similarity score (highest first)
    sources.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    # Generate answer using LLM service
    answer = llm_service.generate_answer(query, relevant_chunks)
    
    return answer, sources

def cleanup_expired_data():
    """
    Clean up expired data from ChromaDB - NEW LOGIC
    """
    try:
        now = datetime.now()
        print(f"🧹 Running cleanup at {now}")
        
        # Get all documents
        all_docs = collection.get()
        
        if not all_docs['ids']:
            print("📭 No documents found in ChromaDB")
            return
        
        expired_ids = []
        for i, metadata in enumerate(all_docs['metadatas']):
            expires_at_str = metadata.get('expires_at')
            if expires_at_str:
                try:
                    expires_at = datetime.fromisoformat(expires_at_str)
                    if now > expires_at:
                        expired_ids.append(all_docs['ids'][i])
                        doc_type = "PERMANENT" if metadata.get('is_permanent') else "SESSION"
                        print(f"🗑️ Marking for deletion: {all_docs['ids'][i]} ({doc_type}, expired at {expires_at})")
                except ValueError as e:
                    print(f"⚠️ Invalid date format for document {all_docs['ids'][i]}: {expires_at_str}")
                    continue
        
        if expired_ids:
            print(f"🧹 Cleaning up {len(expired_ids)} expired documents")
            collection.delete(ids=expired_ids)
            print(f"✅ Successfully deleted {len(expired_ids)} expired documents")
        else:
            print("✅ No expired documents found")
        
        # Check storage usage and clean older data if needed
        check_and_clean_storage()
            
    except Exception as e:
        print(f"❌ Error cleaning expired data: {e}")

def cleanup_session_data(session_id: str):
    """Remove session data from ChromaDB"""
    try:
        print(f"🧹 Cleaning up session data for: {session_id}")
        
        # Get all documents with this session_id
        session_docs = collection.get(where={"session_id": session_id})
        
        if session_docs["ids"]:
            print(f"🗑️ Deleting {len(session_docs['ids'])} chunks for session {session_id}")
            collection.delete(ids=session_docs["ids"])
            print(f"✅ Successfully deleted {len(session_docs['ids'])} chunks for session {session_id}")
        else:
            print(f"📭 No documents found for session {session_id}")
            
    except Exception as e:
        print(f"❌ Error cleaning session data: {e}")

def check_and_clean_storage():
    """
    Check storage usage and clean older data if storage is getting high
    """
    try:
        # Check ChromaDB directory size
        chroma_dir = "chroma_db"
        total_size = 0
        
        if os.path.exists(chroma_dir):
            for dirpath, dirnames, filenames in os.walk(chroma_dir):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    total_size += os.path.getsize(fp)
        
        # Convert to MB
        size_mb = total_size / (1024 * 1024)
        print(f"📊 Current ChromaDB size: {size_mb:.2f} MB")
        
        # If storage exceeds 100MB, clean older data
        if size_mb > 100:
            print("⚠️ Storage limit approaching, cleaning older data...")
            clean_older_data()
            
    except Exception as e:
        print(f"❌ Error checking storage: {e}")

def clean_older_data():
    """
    Clean older session documents first when storage is full
    """
    try:
        cutoff_time = datetime.now() - timedelta(hours=1)
        print(f"🗑️ Cleaning session data older than {cutoff_time}")
        
        # Get only session documents (non-permanent)
        session_docs = collection.get(where={"is_permanent": False})
        old_ids = []
        
        for i, metadata in enumerate(session_docs['metadatas']):
            created_at_str = metadata.get('created_at')
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(created_at_str)
                    if created_at < cutoff_time:
                        old_ids.append(session_docs['ids'][i])
                        print(f"🗑️ Marking old session document: {session_docs['ids'][i]} (created at {created_at})")
                except ValueError:
                    print(f"⚠️ Invalid date format for document {session_docs['ids'][i]}: {created_at_str}")
                    continue
        
        if old_ids:
            print(f"🗑️ Cleaning {len(old_ids)} old session documents to free space")
            collection.delete(ids=old_ids)
            print(f"✅ Successfully deleted {len(old_ids)} old session documents")
        else:
            print("✅ No old session documents found")
            
    except Exception as e:
        print(f"❌ Error cleaning older data: {e}")