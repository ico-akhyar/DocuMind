import { useState } from 'react';
import Header from '../components/Header';
import FileUpload from '../components/FileUpload';
import DocumentList from '../components/DocumentList';
import ChatInterface from '../components/ChatInterface';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSessionCreated = (sessionId: string) => {
    console.log('Dashboard: Session created by upload:', sessionId);
    setCurrentSessionId(sessionId);
  };

  const handleSessionCleared = () => {
    console.log('Dashboard: Session cleared');
    setCurrentSessionId(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />

      {/* Dashboard Header Section */}
      <div className="pt-20 pb-6 bg-gradient-to-br from-gray-900 to-blue-900 dark:from-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-2">
            <img 
              src="/assets/logo.png" 
              alt="DocuMind Logo" 
              className="w-40 h-40 object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">
                DocuMind
              </h1>
              <p className="text-gray-300 mt-1 text-base">
                Your AI Document Assistant - Upload, Process, and Ask Questions
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Toggle Button - Fixed position */}
          <div className="flex items-start sticky top-6 z-10">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="flex-1 flex gap-6">
            {/* Sidebar - Wider when open for better readability */}
            <div className={`
              transition-all duration-500 ease-in-out
              ${sidebarOpen ? 'w-96 opacity-100' : 'w-0 opacity-0 overflow-hidden'}
            `}>
              <div className="space-y-6">
                <FileUpload 
                  onUploadSuccess={handleUploadSuccess} 
                  currentSessionId={currentSessionId}
                  onSessionCreated={handleSessionCreated}
                />
                <DocumentList refreshTrigger={refreshTrigger} />
              </div>
            </div>

            {/* Chat Interface - Expands to fill remaining space */}
            <div className={`
              transition-all duration-500 ease-in-out
              ${sidebarOpen ? 'flex-1' : 'w-full'}
            `}>
              <ChatInterface 
                currentSessionId={currentSessionId}
                onSessionCleared={handleSessionCleared}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}