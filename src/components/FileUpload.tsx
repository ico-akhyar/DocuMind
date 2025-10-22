// FileUpload.tsx - Complete updated version
import { useState, useRef, useEffect } from 'react';
import { Upload, File, X } from 'lucide-react';
import { uploadDocument, getUploadStatus } from '../services/api';

interface FileUploadProps {
  onUploadSuccess: () => void;
  currentSessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

interface ProcessingStatus {
  document_id: number;
  filename: string;
  status: string;
  processing_stage: string;
  chunk_count: number;
  completed: boolean;
}

export default function FileUpload({ onUploadSuccess, currentSessionId, onSessionCreated }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPermanent, setIsPermanent] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'preparing' | 'uploading' | 'processing' | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processingInterval, setProcessingInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (processingInterval) {
        clearInterval(processingInterval);
      }
    };
  }, [processingInterval]);

  const startProgressPolling = (documentId: number) => {
    const interval = setInterval(async () => {
      try {
        const response = await getUploadStatus(documentId);
        const status = response.data;
        setProcessingStatus(status);
        
        // Update progress based on status
        if (status.status === 'extracting') {
          setUploadStage('processing');
          setUploadProgress(25);
        } else if (status.status === 'chunking') {
          setUploadStage('processing');
          setUploadProgress(50);
        } else if (status.status === 'embedding') {
          setUploadStage('processing');
          setUploadProgress(75);
        } else if (status.status === 'storing') {
          setUploadStage('processing');
          setUploadProgress(90);
        } else if (status.status === 'completed') {
          setUploadStage('processing');
          setUploadProgress(100);
          setProcessingStatus(status);
          if (processingInterval) {
            clearInterval(processingInterval);
          }
          // Wait a bit then refresh documents
          setTimeout(() => {
            onUploadSuccess();
            setUploadStage(null);
            setUploadProgress(0);
            setProcessingStatus(null);
          }, 2000);
        } else if (status.status === 'failed') {
          setError('Document processing failed. Please try again.');
          setUploadStage(null);
          setUploadProgress(0);
          setProcessingStatus(null);
          if (processingInterval) {
            clearInterval(processingInterval);
          }
        }
      } catch (err) {
        console.error('Failed to fetch processing status:', err);
      }
    }, 2000); // Poll every 2 seconds
    
    setProcessingInterval(interval);
  };

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
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
  
    setUploading(true);
    setError('');
    setUploadProgress(0);
    setUploadStage('preparing');
    setProcessingStatus(null);
  
    try {
      console.log('📤 Uploading file with isPermanent:', isPermanent);
      
      const response = await uploadDocument(
        selectedFile, 
        isPermanent, 
        (progress) => {
          setUploadProgress(progress);
          setUploadStage(progress < 100 ? 'uploading' : 'processing');
        }
      );
      
      console.log('✅ Upload response:', response.data);
      
      // Show immediate success - processing happens in background
      if (response.data.status === 'queued' || response.data.status === 'processing') {
        // If this is a session upload and we got a session ID, notify parent
        if (!isPermanent && response.data.session_id && onSessionCreated) {
          onSessionCreated(response.data.session_id);
        }
        
        setSelectedFile(null);
        setUploadProgress(100);
        setUploadStage('processing');
        
        // Start polling for processing progress
        startProgressPolling(response.data.document_id);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || err.message || 'Upload failed');
      setUploadProgress(0);
      setUploadStage(null);
      setProcessingStatus(null);
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setError('');
    setUploadProgress(0);
    setUploadStage(null);
    setProcessingStatus(null);
    if (processingInterval) {
      clearInterval(processingInterval);
      setProcessingInterval(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getUploadMethod = () => {
    if (!selectedFile) return '';
    return selectedFile.size > 5 * 1024 * 1024 ? 'Chunked Upload' : 'Direct Upload';
  };

  const getProcessingStageText = () => {
    if (!processingStatus) {
      if (uploadStage === 'preparing') return 'Preparing upload...';
      if (uploadStage === 'uploading') return 'Uploading file...';
      return 'Starting processing...';
    }
    
    const statusMap: { [key: string]: string } = {
      'queued': 'Queued for processing...',
      'processing': 'Starting processing...',
      'extracting': 'Extracting text from document...',
      'chunking': processingStatus.processing_stage || 'Breaking text into chunks...',
      'embedding': processingStatus.processing_stage || 'Generating AI embeddings...',
      'storing': 'Storing in database...',
      'completed': 'Processing complete!',
      'failed': 'Processing failed'
    };
    
    return statusMap[processingStatus.status] || `Processing: ${processingStatus.status}`;
  };

  const getChunkCountText = () => {
    if (!processingStatus || processingStatus.chunk_count === 0) return '';
    return `${processingStatus.chunk_count} chunks processed`;
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
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Method: {getUploadMethod()}
                </p>
              </div>
              <button
                onClick={removeSelectedFile}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                disabled={uploading || processingStatus !== null}
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

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
                    disabled={uploading || processingStatus !== null}
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
                    disabled={uploading || processingStatus !== null}
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

            {/* Enhanced Progress Bar with Processing Status */}
            {(uploadStage || processingStatus) && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">
                    {getProcessingStageText()}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                
                {getChunkCountText() && (
                  <p className="text-xs text-green-600 dark:text-green-400 text-center">
                    ✅ {getChunkCountText()}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {selectedFile.size > 5 * 1024 * 1024 
                    ? 'Using chunked upload for large file' 
                    : 'Using direct upload'
                  }
                  {processingStatus && processingStatus.processing_stage && ` • ${processingStatus.processing_stage}`}
                </p>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || processingStatus !== null}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                </div>
              ) : processingStatus ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
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

      {/* Upload Info */}
      {!selectedFile && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
            💡 Files larger than 5MB will automatically use chunked upload to avoid timeout issues.
          </p>
        </div>
      )}
    </div>
  );
}