import { useState } from 'react';
import Header from '../components/Header';
import FileUpload from '../components/FileUpload';
import DocumentList from '../components/DocumentList';
import ChatInterface from '../components/ChatInterface';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'; // Add this import

export default function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Add this state

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
    <div className="min-h-screen bg-theme-background transition-colors duration-300">
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
          {/* Sidebar Toggle Button */}
          <div className="flex items-start">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Sections - Conditionally rendered */}
            {sidebarOpen && (
              <div className="lg:col-span-1 space-y-6">
                <FileUpload 
                  onUploadSuccess={handleUploadSuccess} 
                  currentSessionId={currentSessionId}
                  onSessionCreated={handleSessionCreated}
                />
                <DocumentList refreshTrigger={refreshTrigger} />
              </div>
            )}

            {/* Chat Interface - Takes remaining space */}
            <div className={sidebarOpen ? "lg:col-span-3" : "lg:col-span-4"}>
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