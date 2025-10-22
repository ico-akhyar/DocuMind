import { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { uploadDocument } from '../services/api';

interface FileUploadProps {
  onUploadSuccess: () => void;
  currentSessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

class FileUtils {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Progress states
  const [progress, setProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('0 KB/s');
  const [timeRemaining, setTimeRemaining] = useState<string>('Calculating...');
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [isChunkedUpload, setIsChunkedUpload] = useState<boolean>(false);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'processing' | 'complete'>('uploading');

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

    if (file.size > 200 * 1024 * 1024) {
      setError('File size must be less than 200MB');
      return;
    }

    setError('');
    setSelectedFile(file);
    resetProgress();
    setIsChunkedUpload(file.size > 2 * 1024 * 1024);
  };

  const resetProgress = () => {
    setProgress(0);
    setCurrentChunk(0);
    setTotalChunks(0);
    setUploadSpeed('0 KB/s');
    setTimeRemaining('Calculating...');
    setUploadedBytes(0);
    setUploadStage('uploading');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
  
    setUploading(true);
    setError('');
    resetProgress();
    setUploadStage('uploading');
  
    try {
      console.log('📤 Starting upload process...');
      
      const startTime = Date.now();
      let lastUpdateTime = startTime;

      // Upload with progress tracking
      const response = await uploadDocument(selectedFile, isPermanent);
      
      console.log('✅ Upload completed successfully');
      
      // Show processing stage
      setUploadStage('processing');
      setProgress(100);
      
      // If this is a session upload and we got a session ID, notify parent
      if (!isPermanent && response.data.session_id && onSessionCreated) {
        onSessionCreated(response.data.session_id);
      }
      
      // Show completion for 2 seconds
      setUploadStage('complete');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset and cleanup
      setSelectedFile(null);
      resetProgress();
      onUploadSuccess();
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (err: any) {
      console.error('❌ Upload failed:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Upload failed';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setError('');
    resetProgress();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStageMessage = () => {
    switch (uploadStage) {
      case 'uploading':
        return isChunkedUpload ? 'Uploading file in chunks...' : 'Uploading file...';
      case 'processing':
        return 'Processing document...';
      case 'complete':
        return 'Upload complete!';
      default:
        return 'Uploading...';
    }
  };

  const getStageIcon = () => {
    switch (uploadStage) {
      case 'uploading':
        return '📤';
      case 'processing':
        return '⚙️';
      case 'complete':
        return '✅';
      default:
        return '📤';
    }
  };

  // Calculate chunks info
  const calculateChunkInfo = () => {
    if (!selectedFile) return { totalChunks: 0, chunkSize: '0 MB' };
    const chunkSize = 2 * 1024 * 1024; // 2MB
    const total = Math.ceil(selectedFile.size / chunkSize);
    return { totalChunks: total, chunkSize: FileUtils.formatBytes(chunkSize) };
  };

  const chunkInfo = calculateChunkInfo();

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
              Supported: PDF, DOCX, TXT, JPG, PNG (Max 200MB)
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
                  {FileUtils.formatBytes(selectedFile.size)}
                </p>
                {isChunkedUpload && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    📦 Will upload in {chunkInfo.totalChunks} chunks ({chunkInfo.chunkSize} each)
                  </p>
                )}
                {!isChunkedUpload && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    🚀 Direct upload
                  </p>
                )}
              </div>
              <button
                onClick={removeSelectedFile}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                disabled={uploading}
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStageIcon()}</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {getStageMessage()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Detailed Progress Info */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-blue-700 dark:text-blue-300">
                      {uploadStage === 'uploading' && isChunkedUpload 
                        ? `Chunk ${currentChunk}/${totalChunks}`
                        : `${progress}%`
                      }
                    </div>
                    <div className="text-blue-600 dark:text-blue-400">Progress</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-semibold text-blue-700 dark:text-blue-300">
                      {FileUtils.formatBytes(uploadedBytes)} / {FileUtils.formatBytes(selectedFile.size)}
                    </div>
                    <div className="text-blue-600 dark:text-blue-400">Uploaded</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-semibold text-blue-700 dark:text-blue-300">
                      {uploadSpeed}
                    </div>
                    <div className="text-blue-600 dark:text-blue-400">Speed</div>
                  </div>
                </div>

                {/* Stage-specific messages */}
                {uploadStage === 'uploading' && isChunkedUpload && (
                  <div className="text-center text-xs text-blue-600 dark:text-blue-400">
                    {timeRemaining !== 'Calculating...' && `⏱️ ${timeRemaining} remaining`}
                  </div>
                )}
                
                {uploadStage === 'processing' && (
                  <div className="text-center text-xs text-blue-600 dark:text-blue-400">
                    ⚙️ Extracting text and generating embeddings...
                  </div>
                )}

                {uploadStage === 'complete' && (
                  <div className="text-center text-xs text-green-600 dark:text-green-400">
                    ✅ Upload completed successfully!
                  </div>
                )}
              </div>
            )}

            {/* Document Type Selection - Only show when not uploading */}
            {!uploading && (
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
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-white">Session Only</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Temporary (30 min), only in current session
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Upload Button - Only show when not uploading */}
            {!uploading && (
              <button
                onClick={handleUpload}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                {`Upload as ${isPermanent ? 'Permanent' : 'Session'} Document`}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          {error.includes('timeout') && (
            <p className="text-xs text-red-500 dark:text-red-300 mt-1">
              💡 Try uploading a smaller file or check your internet connection
            </p>
          )}
          {error.includes('session expired') && (
            <p className="text-xs text-red-500 dark:text-red-300 mt-1">
              🔄 Please try uploading the file again
            </p>
          )}
        </div>
      )}
    </div>
  );
}