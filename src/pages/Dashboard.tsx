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
      <div className="pt-24 pb-8 bg-gradient-to-br from-gray-900 to-blue-900 dark:from-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <img 
              src="/assets/logo.png" 
              alt="DocuMind Logo" 
              className="w-48 h-48 object-contain"
            />
            <div>
              <h1 className="text-4xl font-bold text-white">
                DocuMind
              </h1>
              <p className="text-gray-300 mt-2 text-lg">
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