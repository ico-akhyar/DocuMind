// api.ts
import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = 'https://akhyar919-documind.hf.space';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const CHUNK_UPLOAD_THRESHOLD = 5 * 1024 * 1024; // Use chunked upload for files > 5MB

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// CHANGED: The entire request interceptor is now asynchronous to handle fetching a fresh token
api.interceptors.request.use(async (config) => {
  // Get the currently signed-in user from Firebase
  const user = auth.currentUser;

  if (user) {
    // Always get a fresh ID token. Firebase handles caching for performance.
    // This ensures the token is never expired.
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// CHUNKED UPLOAD FUNCTIONS
const uploadChunked = async (file: File, isPermanent: boolean, onProgress?: (progress: number) => void): Promise<any> => {
  console.log(`📦 Using chunked upload for large file: ${file.name} (${file.size} bytes)`);
  
  // Step 1: Start upload session
  const startResponse = await api.post('/upload/start', {
    filename: file.name,
    file_size: file.size,
    total_chunks: Math.ceil(file.size / CHUNK_SIZE),
  }, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const uploadId = startResponse.data.upload_id;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  console.log(`🆕 Started chunked upload session: ${uploadId}, total chunks: ${totalChunks}`);

  // Step 2: Upload chunks
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    const chunkFormData = new FormData();
    chunkFormData.append('chunk_index', chunkIndex.toString());
    chunkFormData.append('chunk_data', chunk, `chunk_${chunkIndex}`);
    
    await api.post(`/upload/chunk/${uploadId}`, chunkFormData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    // Update progress (90% for upload, 10% for processing)
    const progress = Math.round((chunkIndex + 1) / totalChunks * 90);
    if (onProgress) onProgress(progress);
    
    console.log(`📤 Uploaded chunk ${chunkIndex + 1}/${totalChunks} (${progress}%)`);
  }

  // Step 3: Complete upload
  const completeFormData = new FormData();
  completeFormData.append('is_permanent', isPermanent.toString());
  
  const completeResponse = await api.post(`/upload/complete/${uploadId}`, completeFormData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (onProgress) onProgress(100);
  console.log('✅ Chunked upload completed');
  return completeResponse;
};

// SINGLE FILE UPLOAD (for small files)
const uploadSingle = async (file: File, isPermanent: boolean, onProgress?: (progress: number) => void): Promise<any> => {
  console.log(`📤 Using single upload for small file: ${file.name}`);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('is_permanent', isPermanent.toString());

  // Simulate progress for small files
  if (onProgress) {
    onProgress(50); // Simulate upload
    setTimeout(() => onProgress(100), 500);
  }

  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// MAIN UPLOAD FUNCTION - AUTOMATICALLY CHOOSES METHOD
export const uploadDocument = async (file: File, isPermanent: boolean = true, onProgress?: (progress: number) => void) => {
  console.log(`📎 Uploading file: ${file.name} (${file.size} bytes)`);
  
  // Choose upload method based on file size
  if (file.size > CHUNK_UPLOAD_THRESHOLD) {
    return await uploadChunked(file, isPermanent, onProgress);
  } else {
    return await uploadSingle(file, isPermanent, onProgress);
  }
};

export const queryDocuments = async (
  query: string,
  sessionId?: string,
  sessionOnly: boolean = false,
  queryMode: string = 'Explain'
) => {
  return api.post('/query', {
    query,
    session_id: sessionId,
    session_only: sessionOnly,
    query_mode: queryMode,
  });
};

export const getDocuments = async () => {
  return api.get('/documents');
};

export const deleteDocument = async (filename: string) => {
  return api.delete(`/documents/${filename}`);
};

export const getUploadStatus = async (documentId: number) => {
  return api.get(`/upload/status/${documentId}`);
};

export default api;