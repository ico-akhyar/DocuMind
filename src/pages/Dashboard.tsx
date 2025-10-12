import { useState } from 'react';
import Header from '../components/Header';
import FileUpload from '../components/FileUpload';
import DocumentList from '../components/DocumentList';
import ChatInterface from '../components/ChatInterface';

export default function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-theme-background transition-colors duration-300">
      <Header />

      {/* Dashboard Header Section */}
      <div className="pt-24 pb-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <img 
              src="/assets/logo.png" 
              alt="DocuMind Logo" 
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DocuMind
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Your AI Document Assistant - Upload, Process, and Ask Questions
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
            <DocumentList refreshTrigger={refreshTrigger} />
          </div>

          <div className="lg:col-span-2">
            <ChatInterface />
          </div>
        </div>
      </main>
    </div>
  );
}