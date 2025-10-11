import { useEffect, useState } from 'react';
import { FileText, Trash2, Clock, HardDrive } from 'lucide-react';
import { getDocuments, deleteDocument } from '../services/api';

interface Document {
  filename: string;
  uploaded_at: string;
  document_type: string;
  chunk_count: number;
}

interface DocumentListProps {
  refreshTrigger: number;
}

export default function DocumentList({ refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = async () => {
    try {
      const response = await getDocuments();
      setDocuments(response.data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const handleDelete = async (filename: string) => {
    setDeleting(true);
    try {
      await deleteDocument(filename);
      setDocuments((prev) => prev.filter((doc) => doc.filename !== filename));
      setDeleteModal(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setDeleting(false);
    }
  };

  const permanentDocs = documents.filter((doc) => doc.document_type === 'PERMANENT');
  const sessionDocs = documents.filter((doc) => doc.document_type === 'SESSION');

  if (loading) {
    return (
      <div className="bg-theme-surface rounded-xl shadow-lg p-6 border border-theme-secondary">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-theme-secondary rounded w-1/4"></div>
          <div className="h-16 bg-theme-secondary rounded"></div>
          <div className="h-16 bg-theme-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-theme-surface rounded-xl shadow-lg p-6 border border-theme-secondary transition-all duration-300 hover:shadow-xl">
        <h3 className="text-xl font-semibold text-theme-primary mb-4">Your Documents</h3>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-theme-secondary mx-auto mb-3" />
            <p className="text-theme-secondary font-medium">No documents uploaded yet</p>
            <p className="text-sm text-theme-secondary mt-1">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {permanentDocs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-theme-primary">Permanent Documents</h4>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                    {permanentDocs.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {permanentDocs.map((doc) => (
                    <DocumentCard key={doc.filename} doc={doc} onDelete={setDeleteModal} />
                  ))}
                </div>
              </div>
            )}

            {sessionDocs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <h4 className="font-medium text-theme-primary">Session Documents</h4>
                  <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full font-medium">
                    {sessionDocs.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {sessionDocs.map((doc) => (
                    <DocumentCard key={doc.filename} doc={doc} onDelete={setDeleteModal} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-theme-surface rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 border border-theme-secondary">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-theme-primary">
                Delete Document
              </h3>
            </div>
            
            <p className="text-theme-secondary mb-6">
              Are you sure you want to delete <strong>"{deleteModal}"</strong>? This action cannot be undone and will remove all associated data.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-theme-secondary hover:bg-theme-accent text-theme-primary rounded-xl transition-all duration-200 disabled:opacity-50 font-medium border border-theme-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
              >
                {deleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DocumentCard({ doc, onDelete }: { doc: Document; onDelete: (filename: string) => void }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-theme-primary hover:bg-theme-accent rounded-xl transition-all duration-300 group border border-theme-secondary hover:border-theme-accent hover:shadow-md">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          {getDocumentIcon(doc.filename)}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-theme-primary truncate text-sm">{doc.filename}</p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-xs text-theme-secondary font-medium">
            {doc.chunk_count} {doc.chunk_count === 1 ? 'chunk' : 'chunks'}
          </p>
          <span className="text-xs text-theme-secondary">•</span>
          <p className="text-xs text-theme-secondary font-medium">
            {formatDate(doc.uploaded_at)}
          </p>
          <span className="text-xs text-theme-secondary">•</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            doc.document_type === 'PERMANENT' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
          }`}>
            {doc.document_type === 'PERMANENT' ? 'Permanent' : 'Session'}
          </span>
        </div>
      </div>
      
      <button
        onClick={() => onDelete(doc.filename)}
        className="p-2 text-theme-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
        title="Delete document"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}