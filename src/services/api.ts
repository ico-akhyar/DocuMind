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
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
    
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

export const uploadDocument = async (file: File, isPermanent: boolean = true) => {
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

export default api;