// services/api.ts
import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = 'https://akhyar919-documind.hf.space';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simple file utilities
class FileUtils {
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Enhanced chunked upload with proper progress tracking
export const uploadDocumentChunked = async (
  file: File, 
  isPermanent: boolean = true, 
  onProgress?: (chunkIndex: number, totalChunks: number, uploadedBytes: number) => void
) => {
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  console.log(`📦 Starting chunked upload: ${file.name}, ${totalChunks} chunks (${FileUtils.formatBytes(CHUNK_SIZE)} each)`);

  try {
    // Start upload session
    const startFormData = new FormData();
    startFormData.append('original_filename', file.name);
    startFormData.append('total_size', file.size.toString());
    startFormData.append('is_permanent', isPermanent.toString());

    console.log('🆕 Starting upload session...');
    const startResponse = await api.post('/upload/start', startFormData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });

    const { upload_id, total_chunks } = startResponse.data;
    console.log(`✅ Upload session started: ${upload_id}, expecting ${total_chunks} chunks`);

    // Upload chunks sequentially with progress tracking
    const startTime = Date.now();
    let totalUploadedBytes = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const chunkFormData = new FormData();
      chunkFormData.append('upload_id', upload_id);
      chunkFormData.append('chunk_index', chunkIndex.toString());
      chunkFormData.append('total_chunks', totalChunks.toString());
      chunkFormData.append('chunk', chunk, `chunk_${chunkIndex}`);

      console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks}...`);
      
      try {
        const chunkResponse = await api.post('/upload/chunk', chunkFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000 // 60 seconds per chunk
        });

        totalUploadedBytes += (end - start);
        
        console.log(`✅ Uploaded chunk ${chunkIndex + 1}/${totalChunks}`, {
          chunkSize: FileUtils.formatBytes(end - start),
          totalUploaded: FileUtils.formatBytes(totalUploadedBytes),
          totalFileSize: FileUtils.formatBytes(file.size)
        });
        
        // Call progress callback with accurate information
        if (onProgress) {
          onProgress(chunkIndex, totalChunks, totalUploadedBytes);
        }

        // Small delay between chunks to prevent overwhelming the server
        if (chunkIndex < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error: any) {
        console.error(`❌ Failed to upload chunk ${chunkIndex + 1}:`, error);
        
        if (error.response?.status === 400) {
          throw new Error(`Server rejected chunk ${chunkIndex + 1}: ${error.response.data.detail || 'Bad request'}`);
        } else if (error.response?.status === 404) {
          throw new Error('Upload session expired. Please try again.');
        } else {
          throw new Error(`Network error uploading chunk ${chunkIndex + 1}: ${error.message}`);
        }
      }
    }

    // Complete upload
    console.log(`🎯 All chunks uploaded, completing upload...`);
    const completeFormData = new FormData();
    completeFormData.append('upload_id', upload_id);
    completeFormData.append('original_filename', file.name);
    completeFormData.append('is_compressed', 'false');
    completeFormData.append('is_compression_type', 'none');

    const completeResponse = await api.post('/upload/complete', completeFormData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`✅ Chunked upload completed successfully in ${totalTime.toFixed(1)}s`);
    
    return completeResponse;

  } catch (error) {
    console.error('❌ Chunked upload failed:', error);
    throw error;
  }
};

// Main upload function with progress tracking
export const uploadDocument = async (
  file: File, 
  isPermanent: boolean = true,
  onProgress?: (chunkIndex: number, totalChunks: number, uploadedBytes: number) => void
) => {
  // Use chunked upload for files larger than 2MB (more reliable)
  if (file.size > 2 * 1024 * 1024) {
    console.log('📦 Using chunked upload for reliable transfer');
    return uploadDocumentChunked(file, isPermanent, onProgress);
  }

  // Use regular upload for very small files
  console.log('📤 Using direct upload for small file');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('original_filename', file.name);
  formData.append('is_compressed', 'false');
  formData.append('is_compression_type', 'none');
  formData.append('is_permanent', isPermanent.toString());

  // For small files, simulate progress
  if (onProgress) {
    onProgress(0, 1, file.size); // 100% progress immediately
  }

  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
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