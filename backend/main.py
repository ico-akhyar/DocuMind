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
from rag_query import query_rag, cleanup_expired_data

client = PersistentClient(path="chroma_db")

# Initialize Firebase Admin
try:
    cred = credentials.Certificate("firebase-service-account.json")
    firebase_admin.initialize_app(cred)
except:
    print("Firebase admin not initialized - using development mode")

app = FastAPI(title="RAG Document Processing API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Temporary storage
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory session store (will be replaced with ChromaDB metadata)
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
    return session_id

def validate_session(session_id: str, user_id: str) -> bool:
    """Check if session is valid and belongs to user"""
    if session_id not in user_sessions:
        return False
    session = user_sessions[session_id]
    
    # Check ownership
    if session.user_id != user_id:
        return False
    
    # Check expiration
    if datetime.now() > session.expires_at:
        del user_sessions[session_id]
        return False
    
    # Extend session
    session.expires_at = datetime.now() + timedelta(minutes=30)
    return True

# Background cleanup task
async def background_cleanup():
    """Run every 5 minutes to clean expired sessions and data"""
    while True:
        await asyncio.sleep(300)  # 5 minutes
        now = datetime.now()
        expired_sessions = []
        
        # Clean expired sessions
        for session_id, session in user_sessions.items():
            if now > session.expires_at:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            print(f"Cleaning up expired session: {session_id}")
            cleanup_session_data(session_id)
            del user_sessions[session_id]
        
        # Clean expired data from ChromaDB
        cleanup_expired_data()

# Update the cleanup_session_data function
def cleanup_session_data(session_id: str):
    """Remove session data from ChromaDB"""
    try:
        # Delete all chunks with this session_id
        collection = client.get_collection("documents")
        session_docs = collection.get(where={"session_id": session_id})
        
        if session_docs["ids"]:
            collection.delete(ids=session_docs["ids"])
            print(f"Deleted {len(session_docs['ids'])} chunks for session {session_id}")
    except Exception as e:
        print(f"Error cleaning session data: {e}")

def process_file_background(path, session_id=None, user_id=None, original_filename=None):
    try:
        print(f"Processing file: {path}")
        process_and_store(path, session_id, user_id, original_filename)
        os.remove(path)  # optional: clean temp file
    except Exception as e:
        print(f"[ERROR] Background processing failed: {e}")

# Updated upload endpoint with auth
@app.post("/upload", response_model=UploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    is_private: bool = False,
    user_id: str = Depends(get_current_user)  # Requires authentication
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
        
        return UploadResponse(
            message=f"File '{file.filename}' uploaded successfully",
            file_id=file_id,
            session_id=session_id,
            status="processing"
        )
        
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")

# Updated query endpoint with session validation
# In main.py, update the query endpoint:
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

# Add these endpoints for session management
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

# Start background cleanup on startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(background_cleanup())

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}