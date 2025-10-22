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

// Enhanced Compression utility with Smart Fallback
class FileCompressor {
  static async compressFile(file: File): Promise<{ 
    blob: Blob; 
    isCompressed: boolean; 
    originalSize: number; 
    compressedSize: number;
    compressionType: 'brotli' | 'gzip' | 'none';
  }> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', '.png', '.gif', '.bmp', '.webp'].includes(fileExtension || '');
    
    // Skip compression for images to maintain OCR quality
    if (isImage) {
      console.log('🖼️ Skipping compression for image file');
      return {
        blob: file,
        isCompressed: false,
        originalSize: file.size,
        compressedSize: file.size,
        compressionType: 'none'
      };
    }

    console.log('🗜️ Attempting file compression:', file.name);
    
    // Try Brotli first (better compression)
    try {
      console.log('🔄 Trying Brotli compression...');
      const arrayBuffer = await file.arrayBuffer();
      
      const compressedStream = new CompressionStream('br');
      const writer = compressedStream.writable.getWriter();
      writer.write(new Uint8Array(arrayBuffer));
      writer.close();
      
      const compressedBlob = await new Response(compressedStream.readable).blob();
      
      const compressionInfo = {
        blob: compressedBlob,
        isCompressed: true,
        originalSize: file.size,
        compressedSize: compressedBlob.size,
        compressionType: 'brotli' as const
      };
      
      console.log('✅ Brotli compression successful:', {
        original: this.formatBytes(file.size),
        compressed: this.formatBytes(compressedBlob.size),
        ratio: `${((compressedBlob.size / file.size) * 100).toFixed(1)}%`,
        reduction: `${((1 - (compressedBlob.size / file.size)) * 100).toFixed(1)}% reduction`
      });
      
      return compressionInfo;
    } catch (brotliError) {
      console.log('🔄 Brotli not supported, falling back to gzip...');
      
      // Fallback to gzip compression
      try {
        console.log('🔄 Trying Gzip compression...');
        const arrayBuffer = await file.arrayBuffer();
        
        const compressedStream = new CompressionStream('gzip');
        const writer = compressedStream.writable.getWriter();
        writer.write(new Uint8Array(arrayBuffer));
        writer.close();
        
        const compressedBlob = await new Response(compressedStream.readable).blob();
        
        const compressionInfo = {
          blob: compressedBlob,
          isCompressed: true,
          originalSize: file.size,
          compressedSize: compressedBlob.size,
          compressionType: 'gzip' as const
        };
        
        console.log('✅ Gzip compression successful:', {
          original: this.formatBytes(file.size),
          compressed: this.formatBytes(compressedBlob.size),
          ratio: `${((compressedBlob.size / file.size) * 100).toFixed(1)}%`,
          reduction: `${((1 - (compressedBlob.size / file.size)) * 100).toFixed(1)}% reduction`
        });
        
        return compressionInfo;
      } catch (gzipError) {
        console.error('❌ Both Brotli and Gzip compression failed, using original file');
        return {
          blob: file,
          isCompressed: false,
          originalSize: file.size,
          compressedSize: file.size,
          compressionType: 'none'
        };
      }
    }
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check browser compression support
  static checkCompressionSupport(): { brotli: boolean; gzip: boolean } {
    try {
      new CompressionStream('br');
      return { brotli: true, gzip: true };
    } catch {
      try {
        new CompressionStream('gzip');
        return { brotli: false, gzip: true };
      } catch {
        return { brotli: false, gzip: false };
      }
    }
  }
}

// Chunked upload function for large files
export const uploadDocumentChunked = async (file: File, isPermanent: boolean = true) => {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  console.log(`📦 Starting chunked upload: ${file.name}, ${totalChunks} chunks`);

  // Start upload session
  const startResponse = await api.post('/upload/start', {
    original_filename: file.name,
    total_size: file.size,
    is_permanent: isPermanent.toString()
  }, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  const { upload_id } = startResponse.data;

  // Upload chunks sequentially
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('upload_id', upload_id);
    formData.append('chunk_index', chunkIndex.toString());
    formData.append('total_chunks', totalChunks.toString());
    formData.append('chunk', chunk);

    try {
      await api.post('/upload/chunk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 1 minute per chunk
      });
      
      console.log(`✅ Uploaded chunk ${chunkIndex + 1}/${totalChunks}`);
    } catch (error) {
      console.error(`❌ Failed to upload chunk ${chunkIndex + 1}:`, error);
      throw new Error(`Failed to upload chunk ${chunkIndex + 1}`);
    }
  }

  // Complete upload
  const formData = new FormData();
  formData.append('upload_id', upload_id);
  formData.append('original_filename', file.name);
  formData.append('is_compressed', 'false');
  formData.append('is_compression_type', 'none');

  return api.post('/upload/complete', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Original upload function for small files
export const uploadDocument = async (file: File, isPermanent: boolean = true) => {
  // Use chunked upload for files larger than 10MB
  if (file.size > 10 * 1024 * 1024) {
    console.log('📦 Using chunked upload for large file');
    return uploadDocumentChunked(file, isPermanent);
  }

  // Use regular upload for small files
  const formData = new FormData();
  
  // Check browser compression support
  const support = FileCompressor.checkCompressionSupport();
  console.log('🔍 Browser compression support:', support);
  
  // Compress file before upload
  const compressionResult = await FileCompressor.compressFile(file);
  
  // Use appropriate filename based on compression type
  let uploadFilename = file.name;
  if (compressionResult.isCompressed) {
    if (compressionResult.compressionType === 'brotli') {
      uploadFilename = `${file.name}.br`;
    } else if (compressionResult.compressionType === 'gzip') {
      uploadFilename = `${file.name}.gz`;
    }
  }

  formData.append('file', compressionResult.blob, uploadFilename);
  formData.append('original_filename', file.name);
  formData.append('is_compressed', compressionResult.isCompressed.toString());
  formData.append('is_compression_type', compressionResult.compressionType);
  formData.append('is_permanent', isPermanent.toString());

  console.log('🔄 Upload details:', {
    original: file.name,
    uploadAs: uploadFilename,
    compressed: compressionResult.isCompressed,
    compressionType: compressionResult.compressionType,
    originalSize: FileCompressor.formatBytes(compressionResult.originalSize),
    compressedSize: FileCompressor.formatBytes(compressionResult.compressedSize),
    ratio: `${((compressionResult.compressedSize / compressionResult.originalSize) * 100).toFixed(1)}%`,
    reduction: `${((1 - (compressionResult.compressedSize / compressionResult.originalSize)) * 100).toFixed(1)}% reduction`,
    browserSupport: support
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

// Add this to your api.ts - updated uploadDocumentChunked function
export const uploadDocumentChunked = async (
  file: File, 
  isPermanent: boolean = true, 
  onProgress?: (chunkIndex: number) => void
) => {
  const CHUNK_SIZE = 5 * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  console.log(`📦 Starting chunked upload: ${file.name}, ${totalChunks} chunks`);

  // Start upload session
  const startFormData = new FormData();
  startFormData.append('original_filename', file.name);
  startFormData.append('total_size', file.size.toString());
  startFormData.append('is_permanent', isPermanent.toString());

  const startResponse = await api.post('/upload/start', startFormData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  const { upload_id } = startResponse.data;

  // Upload chunks sequentially
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    const chunkFormData = new FormData();
    chunkFormData.append('upload_id', upload_id);
    chunkFormData.append('chunk_index', chunkIndex.toString());
    chunkFormData.append('total_chunks', totalChunks.toString());
    chunkFormData.append('chunk', chunk);

    try {
      await api.post('/upload/chunk', chunkFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      });
      
      console.log(`✅ Uploaded chunk ${chunkIndex + 1}/${totalChunks}`);
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(chunkIndex);
      }
    } catch (error) {
      console.error(`❌ Failed to upload chunk ${chunkIndex + 1}:`, error);
      throw new Error(`Failed to upload chunk ${chunkIndex + 1}`);
    }
  }

  // Complete upload
  const completeFormData = new FormData();
  completeFormData.append('upload_id', upload_id);
  completeFormData.append('original_filename', file.name);
  completeFormData.append('is_compressed', 'false');
  completeFormData.append('is_compression_type', 'none');

  return api.post('/upload/complete', completeFormData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export default api;