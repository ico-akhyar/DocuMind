import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Code, 
  Check, 
  X, 
  Coffee,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Database
} from 'lucide-react';
import Header from '../components/Header';

const ApiPage: React.FC = () => {
  const [showDonation, setShowDonation] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const apiEndpoints = [
    {
      method: "POST",
      endpoint: "/upload",
      description: "Upload and process documents for RAG system",
      parameters: [
        { name: "file", type: "file", required: true, description: "Document file (PDF, DOCX, TXT, JPG, PNG)" },
        { name: "is_private", type: "boolean", required: false, description: "Store in private session (default: false)" }
      ]
    },
    {
      method: "POST",
      endpoint: "/query",
      description: "Query your documents with RAG system",
      parameters: [
        { name: "query", type: "string", required: true, description: "Question to ask about your documents" },
        { name: "session_id", type: "string", required: false, description: "Private session ID for isolated queries" }
      ]
    },
    {
      method: "GET",
      endpoint: "/documents",
      description: "Get list of user's processed documents",
      parameters: [
        { name: "Authorization", type: "string", required: true, description: "Bearer token for authentication" }
      ]
    },
    {
      method: "DELETE",
      endpoint: "/documents/{filename}",
      description: "Delete a specific document and its chunks",
      parameters: [
        { name: "filename", type: "string", required: true, description: "Name of the document to delete" }
      ]
    },
    {
      method: "GET",
      endpoint: "/health",
      description: "Check API status and system health",
      parameters: []
    }
  ];

  const freePlan = {
    name: "Free API",
    price: "$0",
    description: "Perfect for testing, development, and small projects",
    features: [
      "Unlimited documents/month",
      "Basic RAG functionality",
      "Standard embedding models",
      "Basic Support",
      "API access",
      "All supported file formats",
      "Basic query processing",
      "Private sessions",
    ],
    limitations: [
      "376 dimensions embedding model",
      "Not Fully Transparent/Private",
      "Standard processing speed",
      "Community forum support"
    ],
    cta: "Get Started Free",
    popular: true
  };

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

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300">REST API Documentation</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            API <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Documentation</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Integrate DocuMind's RAG capabilities into your applications with our comprehensive REST API. 
            Fast, reliable, and completely free to use.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="#endpoints"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              View Endpoints
            </a>
            <Link
    to="/register"
    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold rounded-xl transition-colors"
  >
    Get API Key
  </Link>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-16 sm:py-20 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Quick Start</h2>
              
              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Authentication</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Use Firebase JWT tokens for authentication. Include it in the Authorization header:
                  </p>
                  <div className="bg-gray-900 rounded-lg p-4 mb-3 overflow-x-auto">
                    <code className="text-green-400 text-sm">
                      Authorization: Bearer YOUR_FIREBASE_JWT_TOKEN
                    </code>
                  </div>
                  <p className="text-sm text-gray-500">
                    Get your Firebase token from your frontend application after user login.
                  </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Base URL</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <code className="text-green-400 text-sm">
                      https://akhyar919-documind.hf.space
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Example Usage</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Document</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
{`curl -X POST https://akhyar919-documind.hf.space/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@document.pdf" \\
  -F "is_private=true"`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Query Documents</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
{`curl -X POST https://akhyar919-documind.hf.space/query \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What are the main points?",
    "session_id": "optional_session_id"
  }'`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example Response</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
{`{
  "answer": "Based on your documents...",
  "sources": [
    {
      "filename": "document.pdf",
      "page": 1,
      "content_preview": "The main objectives...",
      "similarity_score": 0.956,
      "document_type": "PERMANENT"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Endpoints Section */}
      <section id="endpoints" className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              API Endpoints
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Complete reference for all available endpoints and their parameters.
            </p>
          </div>

          <div className="space-y-6">
            {apiEndpoints.map((endpoint, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      endpoint.method === 'POST' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : endpoint.method === 'GET'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                      {endpoint.endpoint}
                    </code>
                    <button
                      onClick={() => copyToClipboard(endpoint.endpoint, endpoint.endpoint)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      title="Copy endpoint"
                    >
                      {copiedEndpoint === endpoint.endpoint ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {endpoint.description}
                </p>
                {endpoint.parameters.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Parameters:</h4>
                    <div className="space-y-2">
                      {endpoint.parameters.map((param, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                              {param.name}
                            </code>
                            <span className="text-gray-500 text-xs">{param.type}</span>
                            {param.required && (
                              <span className="text-red-500 text-xs font-bold">required</span>
                            )}
                          </div>
                          <span className="text-gray-500 sm:text-left text-xs mt-1 sm:mt-0">{param.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Plan Section */}
      <section className="py-16 sm:py-20 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Completely <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Free</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our API is free to use with reasonable limits to prevent spam and ensure quality service for everyone.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="max-w-2xl w-full">
              <div className="relative rounded-2xl p-8 bg-gradient-to-br from-green-500 to-blue-600 text-white shadow-2xl">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-500 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                    Free Forever
                  </span>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    {freePlan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold">{freePlan.price}</span>
                    <span className="text-lg ml-2 text-green-200">/month</span>
                  </div>
                  <p className="text-green-200">
                    {freePlan.description}
                  </p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {freePlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-300" />
                      <span className="text-white">
                        {feature}
                      </span>
                    </div>
                  ))}
                  
                  {freePlan.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-center space-x-3 opacity-70">
                      <X className="h-5 w-5 text-red-300" />
                      <span className="text-white">
                        {limitation}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Link
  to="/register"
  className="inline-flex items-center justify-center w-full py-3 bg-white text-green-600 rounded-xl font-bold hover:bg-gray-100 transition-colors"
>
  {freePlan.cta}
</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-6">
            <Coffee className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Support Our Development
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            This API is completely free to use. If you find it helpful and want to support its development and maintenance, 
            consider buying me a coffee. Every contribution helps keep this service running and improving!
          </p>

          <button
            onClick={() => setShowDonation(true)}
            className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors"
          >
            <Coffee className="mr-2 h-5 w-5" />
            Support Development
          </button>

          {/* Donation Modal */}
          {showDonation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Support Options
                  </h3>
                  <button
                    onClick={() => setShowDonation(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {donationMethods.map((method, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                        {method.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        {method.type}
                      </p>
                      <p className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded break-all whitespace-pre-line text-sm">
                        {method.details}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                    Thank you for your support! Your contribution helps maintain and improve DocuMind for everyone.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ApiPage;