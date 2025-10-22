// services/api.ts
import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = 'https://akhyar919-documind.hf.space';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for chunked uploads
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simple file utilities without compression
class FileUtils {
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Chunked upload function for large files
export const uploadDocumentChunked = async (
  file: File, 
  isPermanent: boolean = true, 
  onProgress?: (chunkIndex: number, totalChunks: number) => void
) => {
  const CHUNK_SIZE = 2 * 1024 * 1024; // Reduced to 2MB for better reliability
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  console.log(`📦 Starting chunked upload: ${file.name}, ${totalChunks} chunks (${CHUNK_SIZE/1024/1024}MB each)`);

  try {
    // Start upload session
    const startFormData = new FormData();
    startFormData.append('original_filename', file.name);
    startFormData.append('total_size', file.size.toString());
    startFormData.append('is_permanent', isPermanent.toString());

    const startResponse = await api.post('/upload/start', startFormData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });

    const { upload_id } = startResponse.data;
    console.log(`🆕 Upload session started: ${upload_id}`);

    // Upload chunks sequentially
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const chunkFormData = new FormData();
      chunkFormData.append('upload_id', upload_id);
      chunkFormData.append('chunk_index', chunkIndex.toString());
      chunkFormData.append('total_chunks', totalChunks.toString());
      chunkFormData.append('chunk', chunk, `chunk-${chunkIndex}`);

      try {
        await api.post('/upload/chunk', chunkFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 45000 // 45 seconds per chunk
        });
        
        console.log(`✅ Uploaded chunk ${chunkIndex + 1}/${totalChunks}`);
        
        // Call progress callback if provided
        if (onProgress) {
          onProgress(chunkIndex, totalChunks);
        }
      } catch (error) {
        console.error(`❌ Failed to upload chunk ${chunkIndex + 1}:`, error);
        throw new Error(`Failed to upload chunk ${chunkIndex + 1}: ${error}`);
      }
    }

    // Complete upload
    const completeFormData = new FormData();
    completeFormData.append('upload_id', upload_id);
    completeFormData.append('original_filename', file.name);
    completeFormData.append('is_compressed', 'false');
    completeFormData.append('is_compression_type', 'none');

    console.log(`🎯 Completing upload: ${upload_id}`);
    const response = await api.post('/upload/complete', completeFormData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });

    console.log('✅ Chunked upload completed successfully');
    return response;

  } catch (error) {
    console.error('❌ Chunked upload failed:', error);
    throw error;
  }
};

// Original upload function for small files - NO COMPRESSION
export const uploadDocument = async (file: File, isPermanent: boolean = true) => {
  // Use chunked upload for files larger than 5MB
  if (file.size > 5 * 1024 * 1024) {
    console.log('📦 Using chunked upload for file > 5MB');
    return uploadDocumentChunked(file, isPermanent);
  }

  // Use regular upload for small files - NO COMPRESSION
  const formData = new FormData();
  
  // Direct file upload without compression
  formData.append('file', file);
  formData.append('original_filename', file.name);
  formData.append('is_compressed', 'false');
  formData.append('is_compression_type', 'none');
  formData.append('is_permanent', isPermanent.toString());

  console.log('🔄 Upload details:', {
    original: file.name,
    size: FileUtils.formatBytes(file.size),
    compressed: false,
    type: 'direct_upload'
  });

  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000 // 1 minute for small files
  });
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

export default api;