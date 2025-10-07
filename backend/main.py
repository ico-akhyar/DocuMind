# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials
from pydantic import BaseModel
import os
import uuid
import shutil
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import asyncio
from chromadb import PersistentClient
from Data_Extraction import process_and_store
from rag_query import query_rag, cleanup_expired_data, cleanup_session_data

client = PersistentClient(path="chroma_db")

# Initialize Firebase Admin
try:
    cred = credentials.Certificate("firebase-service-account.json")
    firebase_admin.initialize_app(cred)
except:
    print("Firebase admin not initialized - using development mode")

app = FastAPI(title="DocuMind API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://akhyar919/DocuMind.hf.space", "https://huggingface.co"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Temporary storage
UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory session store
user_sessions = {}

# Models
class UploadRequest(BaseModel):
    is_private: bool = False

class UploadResponse(BaseModel):
    message: str
    file_id: str
    session_id: Optional[str] = None
    status: str

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

class UserSession(BaseModel):
    user_id: str
    created_at: datetime
    expires_at: datetime
    files: List[str]
    is_private: bool

class DocumentInfo(BaseModel):
    filename: str
    uploaded_at: str
    document_type: str
    chunk_count: int

# Firebase Auth Dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify Firebase JWT token and return user ID
    """
    try:
        id_token = credentials.credentials
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token['uid']  # Firebase User ID
    except Exception as e:
        # For development, allow mock users
        if id_token.startswith("dev_"):
            return id_token
        raise HTTPException(status_code=401, detail="Invalid authentication token")

# Session Management
def create_user_session(user_id: str, is_private: bool = False) -> str:
    """Create a new session for private documents"""
    session_id = f"{user_id}_{uuid.uuid4().hex[:8]}"
    expires_at = datetime.now() + timedelta(minutes=30)
    
    user_sessions[session_id] = UserSession(
        user_id=user_id,
        created_at=datetime.now(),
        expires_at=expires_at,
        files=[],
        is_private=is_private
    )
    print(f"🆕 Created new session: {session_id}, expires at: {expires_at}")
    return session_id

def validate_session(session_id: str, user_id: str) -> bool:
    """Check if session is valid and belongs to user - NEW LOGIC: Reset on activity"""
    if session_id not in user_sessions:
        print(f"❌ Session not found: {session_id}")
        return False
    
    session = user_sessions[session_id]
    
    # Check ownership
    if session.user_id != user_id:
        print(f"❌ Session ownership mismatch: {session_id}")
        return False
    
    # Check expiration
    if datetime.now() > session.expires_at:
        print(f"❌ Session expired: {session_id}")
        cleanup_session_data(session_id)
        del user_sessions[session_id]
        return False
    
    # NEW: Reset expiration timer on activity (extend by 30 minutes from NOW)
    session.expires_at = datetime.now() + timedelta(minutes=30)
    print(f"🔄 Extended session: {session_id}, new expiry: {session.expires_at}")
    return True

# Background cleanup task
async def background_cleanup():
    """Run every 5 minutes to clean expired sessions and data"""
    while True:
        await asyncio.sleep(300)  # 5 minutes
        now = datetime.now()
        expired_sessions = []
        
        print(f"🕒 Running background cleanup at {now}")
        
        # Clean expired sessions
        for session_id, session in user_sessions.items():
            if now > session.expires_at:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            print(f"🧹 Cleaning up expired session: {session_id}")
            cleanup_session_data(session_id)
            del user_sessions[session_id]
            print(f"✅ Deleted expired session: {session_id}")
        
        # Clean expired data from ChromaDB
        cleanup_expired_data()
        
        print(f"✅ Cleanup completed. Active sessions: {len(user_sessions)}")

def process_file_background(path, session_id=None, user_id=None, original_filename=None):
    try:
        print(f"🔧 Processing file: {path}")
        process_and_store(path, session_id, user_id, original_filename)
        # Clean up temporary file
        if os.path.exists(path):
            os.remove(path)
            print(f"✅ Removed temporary file: {path}")
    except Exception as e:
        print(f"❌ Background processing failed: {e}")

# NEW: Document management functions
def get_user_documents(user_id: str):
    """Get all documents for a user"""
    try:
        collection = client.get_collection("documents")
        # Get both permanent and session documents
        user_docs = collection.get(where={"user_id": user_id})
        
        # Group by filename and document type
        documents_info = {}
        for i, metadata in enumerate(user_docs['metadatas']):
            filename = metadata.get('filename', 'Unknown')
            doc_type = "PERMANENT" if metadata.get('is_permanent') else "SESSION"
            created_at = metadata.get('created_at', '')
            
            if filename not in documents_info:
                documents_info[filename] = {
                    "filename": filename,
                    "uploaded_at": created_at,
                    "document_type": doc_type,
                    "chunk_count": 0
                }
            
            documents_info[filename]["chunk_count"] += 1
        
        return list(documents_info.values())
    except Exception as e:
        print(f"Error getting user documents: {e}")
        return []

def delete_user_document(user_id: str, filename: str):
    """Delete all chunks of a specific document for a user"""
    try:
        collection = client.get_collection("documents")
        # Find all chunks for this user and filename
        docs_to_delete = collection.get(where={
            "user_id": user_id,
            "filename": filename
        })
        
        if docs_to_delete["ids"]:
            collection.delete(ids=docs_to_delete["ids"])
            print(f"✅ Deleted {len(docs_to_delete['ids'])} chunks for document: {filename}")
            return len(docs_to_delete["ids"])
        else:
            print(f"📭 No documents found for: {filename}")
            return 0
    except Exception as e:
        print(f"Error deleting document: {e}")
        return 0

@app.get("/")
async def root():
    return {
        "message": "DocuMind API", 
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/docs")
async def documentation():
    """API documentation"""
    return {
        "endpoints": {
            "POST /upload": "Upload documents for processing",
            "POST /query": "Query your documents",
            "GET /sessions": "Get user sessions", 
            "DELETE /sessions/{session_id}": "Delete session",
            "GET /documents": "Get user's documents",
            "DELETE /documents/{filename}": "Delete a document",
            "GET /health": "Health check"
        }
    }

@app.post("/upload", response_model=UploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    is_private: bool = False,
    user_id: str = Depends(get_current_user)
):
    """
    Upload document - requires Firebase authentication
    """
    try:
        # Validate file type
        allowed_extensions = {'.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png'}
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(400, f"File type {file_extension} not supported")

        # Generate unique file ID
        file_id = f"{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, file_id)
        
        # Save file temporarily
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Handle private mode
        session_id = None
        if is_private:
            session_id = create_user_session(user_id, is_private=True)
            user_sessions[session_id].files.append(file_id)
        
        # Process in background
        background_tasks.add_task(process_file_background, file_path, session_id, user_id, file.filename)
        
        doc_type = "private session" if is_private else "public"
        return UploadResponse(
            message=f"File '{file.filename}' uploaded successfully as {doc_type} document",
            file_id=file_id,
            session_id=session_id,
            status="processing"
        )
        
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Query documents - requires authentication
    """
    try:
        # Validate session if provided
        if request.session_id and not validate_session(request.session_id, user_id):
            raise HTTPException(400, "Invalid or expired session")
        
        # Perform RAG query
        answer, sources = query_rag(
            query=request.query,
            user_id=user_id,
            session_id=request.session_id
        )
        
        return QueryResponse(
            answer=answer,
            sources=sources
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Query error: {str(e)}")
        raise HTTPException(500, f"Query failed: {str(e)}")

@app.get("/sessions")
async def get_user_sessions(user_id: str = Depends(get_current_user)):
    """Get user's active sessions"""
    user_sessions_list = []
    for session_id, session in user_sessions.items():
        if session.user_id == user_id:
            user_sessions_list.append({
                "session_id": session_id,
                "created_at": session.created_at,
                "expires_at": session.expires_at,
                "file_count": len(session.files),
                "is_private": session.is_private
            })
    return user_sessions_list

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user_id: str = Depends(get_current_user)):
    """Manually delete a session"""
    if session_id in user_sessions and user_sessions[session_id].user_id == user_id:
        cleanup_session_data(session_id)
        del user_sessions[session_id]
        return {"message": "Session deleted"}
    raise HTTPException(404, "Session not found")

# NEW: Document management endpoints
@app.get("/documents")
async def get_user_documents_endpoint(user_id: str = Depends(get_current_user)):
    """Get user's documents"""
    documents = get_user_documents(user_id)
    return {"documents": documents}

@app.delete("/documents/{filename}")
async def delete_document(filename: str, user_id: str = Depends(get_current_user)):
    """Delete a specific document"""
    deleted_count = delete_user_document(user_id, filename)
    if deleted_count > 0:
        return {"message": f"Document '{filename}' deleted successfully", "chunks_deleted": deleted_count}
    else:
        raise HTTPException(404, f"Document '{filename}' not found")

# Start background cleanup on startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(background_cleanup())
    print("🚀 DocuMind API started with background cleanup")

@app.get("/debug/cleanup")
async def debug_cleanup():
    """Manual trigger for cleanup (for testing)"""
    try:
        # Clean expired sessions
        now = datetime.now()
        expired_sessions = []
        
        for session_id, session in user_sessions.items():
            if now > session.expires_at:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            cleanup_session_data(session_id)
            del user_sessions[session_id]
        
        # Clean ChromaDB
        cleanup_expired_data()
        
        return {
            "message": "Cleanup completed",
            "expired_sessions_cleaned": len(expired_sessions),
            "active_sessions": len(user_sessions)
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/health")
async def health_check():
    import os
    # Check ChromaDB size
    chroma_size = 0
    if os.path.exists("chroma_db"):
        for dirpath, dirnames, filenames in os.walk("chroma_db"):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                chroma_size += os.path.getsize(fp)
    
    # Get document counts
    collection = client.get_collection("documents")
    all_docs = collection.get()
    permanent_count = sum(1 for meta in all_docs['metadatas'] if meta.get('is_permanent'))
    session_count = len(all_docs['metadatas']) - permanent_count
    
    return {
        "status": "healthy", 
        "timestamp": datetime.now(),
        "chroma_db_size_mb": f"{chroma_size / (1024*1024):.2f}",
        "active_sessions": len(user_sessions),
        "documents": {
            "permanent": permanent_count,
            "session": session_count,
            "total": len(all_docs['metadatas'])
        }
    }