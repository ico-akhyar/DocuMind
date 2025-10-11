import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Zap, 
  Shield, 
  Code, 
  Calendar,
  Check,
  X,
  Star,
  GitBranch,
  Rocket,
  FileText,
  Database,
  Cpu,
  Globe,
  Lock,
  Scale,
  Upload,
  Search,
  Users,
  Coffee,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

const DocuMind: React.FC = () => {
  const [activePhase, setActivePhase] = useState(3);
  const [showDonation, setShowDonation] = useState(false);

  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Multi-Format RAG",
      description: "Intelligent document processing with Retrieval-Augmented Generation for PDF, DOCX, images, and text files",
      status: "available"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Q&A",
      description: "Ask questions about your documents and get intelligent answers with source citations",
      status: "available"
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Vector Search",
      description: "Semantic search across your documents using state-of-the-art embeddings",
      status: "available"
    },
    {
      icon: <Cpu className="h-6 w-6" />,
      title: "Real-time Processing",
      description: "Process and query documents in real-time with automatic background ingestion",
      status: "available"
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Upload Documents",
      description: "Upload PDF, DOCX, TXT, or image files through our REST API or web interface",
      icon: <Upload className="h-8 w-8" />
    },
    {
      step: "02",
      title: "AI Processing",
      description: "Documents are automatically chunked, embedded, and stored in vector database",
      icon: <Cpu className="h-8 w-8" />
    },
    {
      step: "03",
      title: "Ask Questions",
      description: "Query your documents and get AI-powered answers with source citations",
      icon: <Search className="h-8 w-8" />
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">DM</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">DocuMind</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 mb-8">
              <Rocket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Free API Available
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Intelligent Document
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Understanding
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your documents into searchable knowledge with AI-powered RAG technology. 
              Ask questions, get precise answers, and unlock insights from your files instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-colors"
              >
                View Features
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { number: '5+', label: 'File Formats' },
                { number: '99.9%', label: 'Uptime' },
                { number: '<1s', label: 'Response Time' },
                { number: 'AI', label: 'Powered' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to transform your documents into intelligent, searchable knowledge bases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 ${
                    feature.status === 'available' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-8 mb-4">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">{step.step}</div>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Documents?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who are already using DocuMind to unlock the power of their documents.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-semibold transition-colors"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DM</span>
              </div>
              <span className="text-lg font-bold">DocuMind</span>
            </div>
            <div className="flex space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
                Register
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 DocuMind. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocuMind;