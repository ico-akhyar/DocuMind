import { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { uploadDocument } from '../services/api';

interface FileUploadProps {
  onUploadSuccess: () => void;
  currentSessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

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

    console.log('🗜️ Compressing file with Brotli:', file.name);
    
    try {
      // Read file content
      const arrayBuffer = await file.arrayBuffer();
      
      // Use Brotli compression (much better than gzip)
      const compressedStream = new CompressionStream('br'); // 'br' for Brotli
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
      
      console.log('✅ Brotli compression complete:', {
        original: this.formatBytes(file.size),
        compressed: this.formatBytes(compressedBlob.size),
        ratio: `${((compressedBlob.size / file.size) * 100).toFixed(1)}%`,
        reduction: `${((1 - (compressedBlob.size / file.size)) * 100).toFixed(1)}% reduction`
      });
      
      return compressionInfo;
    } catch (error) {
      console.error('❌ Brotli compression failed, using original file:', error);
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

export default function FileUpload({ onUploadSuccess, currentSessionId, onSessionCreated }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPermanent, setIsPermanent] = useState(true);
  const [error, setError] = useState('');
  const [compressionInfo, setCompressionInfo] = useState<{isCompressed: boolean; originalSize: number; compressedSize: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
      setError('Unsupported file type. Please upload PDF, DOCX, TXT, or image files.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setError('');
    setSelectedFile(file);
    setCompressionInfo(null); // Reset compression info when new file is selected
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      console.log('📤 Uploading file with isPermanent:', isPermanent);
      console.log('📤 File will be uploaded as:', isPermanent ? 'PERMANENT' : 'SESSION');
      
      // Compress file before upload
      const compressionResult = await FileCompressor.compressFile(selectedFile);
      setCompressionInfo({
        isCompressed: compressionResult.isCompressed,
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize
      });

      const response = await uploadDocument(
        compressionResult.blob, 
        selectedFile.name,
        compressionResult.isCompressed,
        isPermanent
      );
      
      console.log('✅ Upload response:', response.data);
      
      // If this is a session upload and we got a session ID, notify parent
      if (!isPermanent && response.data.session_id && onSessionCreated) {
        onSessionCreated(response.data.session_id);
      }
      
      setSelectedFile(null);
      setCompressionInfo(null);
      onUploadSuccess();
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setCompressionInfo(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Document</h3>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
        />

        {!selectedFile ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Drag and drop your file here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or click to browse
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            >
              Select File
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported: PDF, DOCX, TXT, JPG, PNG (Max 50MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <File className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {FileCompressor.formatBytes(selectedFile.size)}
                  {compressionInfo && compressionInfo.isCompressed && (
                    <span className="text-green-600 dark:text-green-400 ml-2">
                      → {FileCompressor.formatBytes(compressionInfo.compressedSize)} 
                      ({((compressionInfo.compressedSize / compressionInfo.originalSize) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={removeSelectedFile}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                disabled={uploading}
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Compression Info */}
            {compressionInfo && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    🗜️ File compressed
                  </span>
                  <span className="text-green-600 dark:text-green-400">
                    {FileCompressor.formatBytes(compressionInfo.originalSize)} → {FileCompressor.formatBytes(compressionInfo.compressedSize)}
                  </span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {compressionInfo.isCompressed ? 
                    `Reduced by ${(((compressionInfo.originalSize - compressionInfo.compressedSize) / compressionInfo.originalSize) * 100).toFixed(1)}% - Faster upload!` : 
                    'Image file - No compression applied to maintain quality'
                  }
                </div>
              </div>
            )}

            {/* Document Type Selection */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Document Type:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="radio"
                    name="documentType"
                    checked={isPermanent}
                    onChange={() => setIsPermanent(true)}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    disabled={uploading}
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">Permanent</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Stored for 14 days, searchable in all sessions
                    </p>
                  </div>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="radio"
                    name="documentType"
                    checked={!isPermanent}
                    onChange={() => setIsPermanent(false)}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    disabled={uploading}
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">Session Only</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Temporary (30 min), only in current session
                    </p>
                  </div>
                </label>
              </div>
              
              {/* Debug Info */}
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-600 dark:text-blue-400">
                📝 Will upload as: <strong>{isPermanent ? 'PERMANENT' : 'SESSION'}</strong>
                {currentSessionId && !isPermanent && (
                  <div>Using existing session: {currentSessionId}</div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </div>
              ) : (
                `Upload as ${isPermanent ? 'Permanent' : 'Session'} Document`
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Upload Status */}
      {uploading && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
            ⏳ Uploading and processing document... This may take a moment.
          </p>
        </div>
      )}
    </div>
  );
}