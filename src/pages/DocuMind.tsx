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
  GitBranch,
  Rocket,
  FileText,
  Database,
  Cpu,
  Globe,
  Scale,
  Upload,
  Search,
  Users,
  Coffee,
  ArrowRight,
  MessageSquare,
  Star
} from 'lucide-react';
import Header from '../components/Header';

const DocuMind: React.FC = () => {
  const [activePhase, setActivePhase] = useState(3);
  const [showDonation, setShowDonation] = useState(false);

  const roadmap = [
    {
      phase: 1,
      title: "RAG System Foundation",
      status: "completed",
      date: "Q3 2025",
      features: [
        "ChromaDB vector database integration",
        "Document chunking and embedding",
        "Basic semantic search",
        "FastAPI backend framework"
      ],
      milestones: [
        "✅ ChromaDB integration completed",
        "✅ Document processing pipeline built",
        "✅ Basic RAG query system implemented"
      ]
    },
    {
      phase: 2,
      title: "Multi-Format Processing",
      status: "completed",
      date: "Q3 2025",
      features: [
        "PDF text extraction with pdfplumber",
        "Scanned PDF OCR with Tesseract",
        "DOCX document parsing",
        "Image text extraction"
      ],
      milestones: [
        "✅ PDF text extraction implemented",
        "✅ OCR for scanned documents",
        "✅ Multi-format support completed"
      ]
    },
    {
      phase: 3,
      title: "AI Integration & Security",
      status: "current",
      date: "Q4 2025",
      features: [
        "OpenAI GPT-4 integration",
        "Firebase authentication",
        "Session-based document management",
        "User isolation and privacy"
      ],
      milestones: [
        "🔄 OpenAI API integration",
        "🆕 Firebase auth implemented",
        "🔒 User session management"
      ]
    },
    {
      phase: 4,
      title: "Advanced RAG Features",
      status: "upcoming",
      date: "Q4 2025",
      features: [
        "Hybrid search (vector + keyword)",
        "Query understanding and expansion",
        "Multi-hop reasoning",
        "Citation and source tracking"
      ],
      milestones: [
        "🔍 Hybrid search algorithms",
        "🧠 Query optimization",
        "📚 Advanced citation system"
      ]
    }
  ];

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Multi-Format RAG",
      description: "Intelligent document processing with Retrieval-Augmented Generation for PDF, DOCX, images, and text files",
      status: "available"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Q&A",
      description: "Ask questions about your documents and get intelligent answers with source citations",
      status: "available"
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: "Vector Search",
      description: "Semantic search across your documents using state-of-the-art embeddings",
      status: "available"
    },
    {
      icon: <Cpu className="h-8 w-8" />,
      title: "Real-time Processing",
      description: "Process and query documents in real-time with automatic background ingestion",
      status: "available"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure Sessions",
      description: "Private session management with automatic expiration and user isolation",
      status: "available"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "RESTful API",
      description: "Complete REST API with Firebase authentication and comprehensive documentation",
      status: "available"
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Upload Documents",
      description: "Upload PDF, DOCX, TXT, or image files through our REST API or web interface",
      icon: <Upload className="h-12 w-12" />
    },
    {
      step: "02",
      title: "AI Processing",
      description: "Documents are automatically chunked, embedded, and stored in vector database",
      icon: <Cpu className="h-12 w-12" />
    },
    {
      step: "03",
      title: "Ask Questions",
      description: "Query your documents and get AI-powered answers with source citations",
      icon: <Search className="h-12 w-12" />
    }
  ];

  const donationMethods = [
    {
      name: "JazzCash",
      details: "Account Title: Ikhiar Ahmed\nAccount Number: 0320-6313989",
      type: "Mobile Account"
    },
    {
      name: "EasyPaisa", 
      details: "Account Title: Ikhiar Ahmed\nAccount Number: 0340-1838589",
      type: "Mobile Account"
    },
    {
      name: "Bank Account",
      details: "Bank: Meezan Bank Limited\nBranch: Liaquatpur\nBranch Code: 9821\nAccount: 0111325860\nIBAN: PK64MEZN0098210111325860",
      type: "Bank Transfer"
    },
    {
      name: "Email",
      details: "oryvoai@gmail.com\nakhyarahmad919@gmail.com",
      type: "For Questions"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 px-4 sm:px-6 lg:px-8 pt-16">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center text-white">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <Rocket className="h-4 w-4" />
            <span>Free API - Rate Limited to Prevent Spam</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8">
            <span className="block">Docu</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Mind
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed opacity-90">
            Intelligent Document AI with RAG - Ask questions, get answers from your documents with <span className="font-semibold">human-like comprehension</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16">
            <Link
              to="/api"
              className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              <Code className="mr-2 sm:mr-3 h-4 w-4 sm:h-6 sm:w-6" />
              Explore API
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              Get Started Free
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              { number: '5+', label: 'File Formats' },
              { number: '99.9%', label: 'Uptime' },
              { number: '<1s', label: 'Query Time' },
              { number: 'RAG', label: 'AI Powered' }
            ].map((stat, index) => (
              <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{stat.number}</div>
                <div className="text-xs sm:text-sm text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Powerful <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">RAG Features</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              DocuMind combines Retrieval-Augmented Generation with enterprise-grade infrastructure for intelligent document processing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 lg:p-8 hover:scale-105 transition-all duration-500 border-2 ${
                  feature.status === 'available' 
                    ? 'border-green-200 dark:border-green-800' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                  feature.status === 'available' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-500 text-white'
                }`}>
                  {feature.icon}
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    feature.status === 'available' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {feature.status}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              How <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">DocuMind</span> Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl p-8 mb-4">
                  <div className="text-2xl font-bold mb-4">{step.step}</div>
                  <div className="flex justify-center mb-4">
                    <div className="bg-white/20 rounded-xl p-4">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="opacity-90">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Development <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Roadmap</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Follow our journey as we build the most advanced document RAG platform.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-purple-600 to-pink-600 h-full"></div>
            
            <div className="space-y-12">
              {roadmap.map((phase, index) => (
                <div
                  key={phase.phase}
                  className={`relative flex flex-col md:flex-row items-center ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'} mb-4 md:mb-0`}>
                    <div 
                      className={`rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                        activePhase === phase.phase ? 'scale-105 shadow-2xl' : 'hover:scale-102'
                      } ${
                        phase.status === 'completed' 
                          ? 'border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                          : phase.status === 'current'
                          ? 'border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-2 border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => setActivePhase(phase.phase)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            phase.status === 'completed' 
                              ? 'bg-green-500' 
                              : phase.status === 'current'
                              ? 'bg-yellow-500 animate-pulse'
                              : 'bg-gray-400'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Phase {phase.phase}
                          </span>
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {phase.date}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          phase.status === 'completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : phase.status === 'current'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {phase.status}
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {phase.title}
                      </h3>
                      
                      <div className="space-y-3">
                        {phase.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-3">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white dark:bg-gray-900 border-4 border-purple-600 rounded-full z-10"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-2xl mb-6">
            <Coffee className="h-10 w-10 text-white" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Support Our Development
          </h2>
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto">
            This API is completely free to use. If you find it helpful and want to support its development and maintenance, 
            consider buying me a coffee. Every contribution helps keep this service running and improving!
          </p>

          <button
            onClick={() => setShowDonation(true)}
            className="inline-flex items-center justify-center px-8 py-4 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all duration-300 transform hover:scale-105"
          >
            <Coffee className="mr-3 h-6 w-6" />
            Support Development
          </button>

          {/* Donation Modal */}
          {showDonation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Support Options
                  </h3>
                  <button
                    onClick={() => setShowDonation(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {donationMethods.map((method, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                        {method.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        {method.type}
                      </p>
                      <p className="font-mono bg-gray-100 dark:bg-gray-700 p-3 rounded break-all whitespace-pre-line text-sm">
                        {method.details}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                    Thank you for your support! Your contribution helps maintain and improve DocuMind for everyone.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
<section className="py-16 sm:py-20 lg:py-32 bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900 text-white px-4 sm:px-6 lg:px-8">
  <div className="max-w-4xl mx-auto text-center">
    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
      Ready to Get Started?
    </h2>
    <p className="text-xl md:text-2xl mb-8 sm:mb-12 opacity-90">
      Join developers worldwide using our free RAG API to build intelligent document applications.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
      <Link
        to="/api#endpoints"
        className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
      >
        <Code className="mr-3 h-6 w-6" />
        Explore API
      </Link>
      <Link
        to="/register"
        className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105"
      >
        Start Building Now
      </Link>
    </div>
  </div>
</section>
    </div>
  );
};

export default DocuMind;