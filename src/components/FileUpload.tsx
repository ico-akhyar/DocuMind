import { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { uploadDocument } from '../services/api';

interface FileUploadProps {
  onUploadSuccess: () => void;
  currentSessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

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

// Custom hook for tracking upload progress
const useUploadProgress = () => {
  const [progress, setProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('0 KB/s');
  const [timeRemaining, setTimeRemaining] = useState<string>('Calculating...');
  const [uploadedBytes, setUploadedBytes] = useState(0);

  const updateProgress = (chunkIndex: number, totalChunks: number, startTime: number, fileSize: number) => {
    const currentProgress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
    setProgress(currentProgress);
    setCurrentChunk(chunkIndex + 1);
    setTotalChunks(totalChunks);
    
    // Calculate uploaded bytes (approx)
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks
    const currentUploadedBytes = Math.min((chunkIndex + 1) * chunkSize, fileSize);
    setUploadedBytes(currentUploadedBytes);

    // Calculate upload speed
    const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
    if (elapsedTime > 0) {
      const uploadedMB = currentUploadedBytes / (1024 * 1024);
      const averageSpeed = uploadedMB / elapsedTime;
      
      if (averageSpeed < 1) {
        setUploadSpeed(`${(averageSpeed * 1024).toFixed(1)} KB/s`);
      } else {
        setUploadSpeed(`${averageSpeed.toFixed(1)} MB/s`);
      }

      // Calculate time remaining
      const bytesRemaining = fileSize - currentUploadedBytes;
      const bytesPerSecond = currentUploadedBytes / elapsedTime;
      
      if (bytesPerSecond > 0) {
        const secondsRemaining = bytesRemaining / bytesPerSecond;
        
        if (secondsRemaining < 60) {
          setTimeRemaining(`${Math.ceil(secondsRemaining)} seconds`);
        } else if (secondsRemaining < 3600) {
          setTimeRemaining(`${Math.ceil(secondsRemaining / 60)} minutes`);
        } else {
          setTimeRemaining(`${Math.ceil(secondsRemaining / 3600)} hours`);
        }
      } else {
        setTimeRemaining('Calculating...');
      }
    }
  };

  const resetProgress = () => {
    setProgress(0);
    setCurrentChunk(0);
    setTotalChunks(0);
    setUploadSpeed('0 KB/s');
    setTimeRemaining('Calculating...');
    setUploadedBytes(0);
  };

  return {
    progress,
    currentChunk,
    totalChunks,
    uploadSpeed,
    timeRemaining,
    uploadedBytes,
    updateProgress,
    resetProgress
  };
};

export default function FileUpload({ onUploadSuccess, currentSessionId, onSessionCreated }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPermanent, setIsPermanent] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use the progress tracking hook
  const {
    progress,
    currentChunk,
    totalChunks,
    uploadSpeed,
    timeRemaining,
    uploadedBytes,
    updateProgress,
    resetProgress
  } = useUploadProgress();

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
    setUploadStage('uploading');
    
    // Determine if chunked upload will be used
    setIsChunkedUpload(file.size > 5 * 1024 * 1024);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
  
    setUploading(true);
    setError('');
    resetProgress();
    setUploadStage('uploading');
  
    try {
      console.log('📤 Starting upload:', {
        filename: selectedFile.name,
        size: FileUtils.formatBytes(selectedFile.size),
        isPermanent: isPermanent,
        useChunked: selectedFile.size > 5 * 1024 * 1024
      });

      const startTime = Date.now();
      
      // Upload the file - the API will decide whether to use chunked upload
      const response = await uploadDocument(selectedFile, isPermanent);
      
      console.log('✅ Upload completed successfully:', response.data);
      
      // If this is a session upload and we got a session ID, notify parent
      if (!isPermanent && response.data.session_id && onSessionCreated) {
        onSessionCreated(response.data.session_id);
      }
      
      // Show completion
      setUploadStage('complete');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Show completion for 1.5 seconds
      
      // Reset and cleanup
      setSelectedFile(null);
      resetProgress();
      setIsChunkedUpload(false);
      onUploadSuccess();
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (err: any) {
      console.error('❌ Upload failed:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Upload failed';
      setError(errorMessage);
      resetProgress();
      setUploadStage('uploading');
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setError('');
    resetProgress();
    setUploadStage('uploading');
    setIsChunkedUpload(false);
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
                {isChunkedUpload && selectedFile.size > 5 * 1024 * 1024 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    📦 Will be uploaded in {Math.ceil(selectedFile.size / (2 * 1024 * 1024))} chunks (2MB each)
                  </p>
                )}
                {selectedFile.size <= 5 * 1024 * 1024 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    🚀 Small file - direct upload
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
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Progress Stats */}
                <div className="grid grid-cols-2 gap-4 text-xs text-blue-600 dark:text-blue-400">
                  <div className="text-center">
                    <div className="font-medium">
                      {FileUtils.formatBytes(uploadedBytes)} / {FileUtils.formatBytes(selectedFile.size)}
                    </div>
                    <div className="text-blue-500 dark:text-blue-300">Uploaded</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{uploadSpeed}</div>
                    <div className="text-blue-500 dark:text-blue-300">Speed</div>
                  </div>
                </div>

                {isChunkedUpload && (
                  <div className="text-center text-xs text-blue-600 dark:text-blue-400">
                    Chunk {currentChunk} of {totalChunks} • {timeRemaining} remaining
                  </div>
                )}

                {/* Connection info for slow speeds */}
                {uploadSpeed.includes('KB/s') && (
                  <div className="text-center text-xs text-amber-600 dark:text-amber-400">
                    ⚡ Tip: For faster uploads, try using a better network connection
                  </div>
                )}
              </div>
            )}

            {/* Document Type Selection */}
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
              </div>
            )}

            {/* Upload Button */}
            {!uploading && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
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
        </div>
      )}
    </div>
  );
}