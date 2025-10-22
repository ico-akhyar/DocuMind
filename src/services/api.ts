// services/api.ts
import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = 'https://akhyar919-documind.hf.space';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Compression utility
class FileCompressor {
  static async compressFile(file: File): Promise<{ blob: Blob; isCompressed: boolean; originalSize: number; compressedSize: number }> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
    
    // Skip compression for images to maintain OCR quality
    if (isImage) {
      console.log('🖼️ Skipping compression for image file');
      return {
        blob: file,
        isCompressed: false,
        originalSize: file.size,
        compressedSize: file.size
      };
    }

    console.log('🗜️ Compressing file:', file.name);
    
    try {
      // Read file content
      const arrayBuffer = await file.arrayBuffer();
      
      // Create gzip compressed blob
      const compressedStream = new CompressionStream('gzip');
      const writer = compressedStream.writable.getWriter();
      writer.write(new Uint8Array(arrayBuffer));
      writer.close();
      
      const compressedBlob = await new Response(compressedStream.readable).blob();
      
      const compressionInfo = {
        blob: compressedBlob,
        isCompressed: true,
        originalSize: file.size,
        compressedSize: compressedBlob.size
      };
      
      console.log('✅ Compression complete:', {
        original: this.formatBytes(file.size),
        compressed: this.formatBytes(compressedBlob.size),
        ratio: `${((compressedBlob.size / file.size) * 100).toFixed(1)}%`
      });
      
      return compressionInfo;
    } catch (error) {
      console.error('❌ Compression failed, using original file:', error);
      return {
        blob: file,
        isCompressed: false,
        originalSize: file.size,
        compressedSize: file.size
      };
    }
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// FIXED: Updated function signature to match what FileUpload.tsx is calling
export const uploadDocument = async (
  fileBlob: Blob, 
  originalFilename: string, 
  isCompressed: boolean, 
  isPermanent: boolean = true
) => {
  const formData = new FormData();
  
  // Use appropriate filename
  const uploadFilename = isCompressed ? `${originalFilename}.gz` : originalFilename;
  
  formData.append('file', fileBlob, uploadFilename);
  formData.append('original_filename', originalFilename);
  formData.append('is_compressed', isCompressed.toString());
  formData.append('is_permanent', isPermanent.toString());

  console.log('🔄 Upload details:', {
    original: originalFilename,
    uploadAs: uploadFilename,
    compressed: isCompressed,
    isPermanent: isPermanent
  });

  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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