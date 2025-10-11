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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Documents</h3>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {permanentDocs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Permanent Documents</h4>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
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
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Session Documents</h4>
                  <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Document
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{deleteModal}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DocumentCard({ doc, onDelete }: { doc: Document; onDelete: (filename: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-650 transition-colors group">
      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">{doc.filename}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {doc.chunk_count} chunks • {new Date(doc.uploaded_at).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={() => onDelete(doc.filename)}
        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}
