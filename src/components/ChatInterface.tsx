import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Trash2 } from 'lucide-react';
import { queryDocuments } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  sources?: Array<{
    filename: string;
    page: number;
    chunk_id: number;
    content_preview: string;
    full_content?: string;
    similarity_score: number;
    document_type: string;
  }>;
  timestamp: Date;
}

interface ChatInterfaceProps {
  currentSessionId?: string;
  onSessionCleared?: () => void;
}

export default function ChatInterface({ currentSessionId, onSessionCleared }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryMode, setQueryMode] = useState('Explain');
  const [sessionOnly, setSessionOnly] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // When we get a session ID from uploads, auto-enable session mode
  useEffect(() => {
    if (currentSessionId && !sessionOnly) {
      console.log('Auto-enabling session mode for session:', currentSessionId);
      setSessionOnly(true);
    }
  }, [currentSessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log('🔍 Querying with session:', {
        sessionId: currentSessionId,
        sessionOnly,
        queryMode
      });

      // Use the backend-generated session ID, not frontend-generated
      const response = await queryDocuments(
        input, 
        currentSessionId, // Use the actual session ID from backend
        sessionOnly, 
        queryMode
      );

      // NEW: Log retrieved chunks to browser console for evaluation
      console.log('📋 RAG RETRIEVED CHUNKS FOR EVALUATION', {
        query: input,
        sessionId: currentSessionId,
        sessionOnly,
        queryMode,
        totalChunks: response.data.sources?.length || 0,
        chunks: response.data.sources?.map((source, index) => ({
          chunkIndex: index + 1,
          filename: source.filename,
          page: source.page,
          chunkId: source.chunk_id,
          documentType: source.document_type,
          similarityScore: source.similarity_score,
          contentPreview: source.content_preview,
          fullContent: source.full_content, // This contains the full chunk text
          textLength: source.full_content?.length || 0
        })) || []
      });

      // Also log individual chunks for easier inspection
      if (response.data.sources && response.data.sources.length > 0) {
        console.log('🔍 INDIVIDUAL CHUNK DETAILS:');
        response.data.sources.forEach((source, index) => {
          console.log(`\n--- CHUNK ${index + 1} ---`);
          console.log(`Filename: ${source.filename}`);
          console.log(`Page: ${source.page}`);
          console.log(`Document Type: ${source.document_type}`);
          console.log(`Similarity: ${source.similarity_score}`);
          console.log(`Text Length: ${source.full_content?.length || 0} chars`);
          console.log('Full Text:', source.full_content);
          console.log('-------------------\n');
        });
      } else {
        console.log('❌ No chunks retrieved for this query');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.data.answer,
        sources: response.data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Query error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: err.response?.data?.detail || 'Failed to get response. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionToggle = (newSessionOnly: boolean) => {
    setSessionOnly(newSessionOnly);
    
    // Add system message based on the new mode
    const systemMessage: Message = {
      id: `session_mode_${Date.now()}`,
      type: 'bot',
      content: newSessionOnly 
        ? 'Session-only mode activated. I will only search through documents uploaded in this session.'
        : 'Hybrid mode activated. I will search through both permanent documents and session documents.',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, systemMessage]);
    
    // REMOVED: Don't clear the session when toggling off session-only mode
    // The session should persist and be available for future toggles
  };

  const handleClearSession = () => {
    if (onSessionCleared) {
      onSessionCleared();
      const systemMessage: Message = {
        id: `session_cleared_${Date.now()}`,
        type: 'bot',
        content: 'Session cleared. All session documents have been removed.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
      setSessionOnly(false); // Also disable session-only mode when clearing
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col h-[800px] transition-colors duration-300">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Chat with Your Documents</h3>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Query Mode
            </label>
            <select
              value={queryMode}
              onChange={(e) => setQueryMode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="Explain">Explain</option>
              <option value="Summarize">Summarize</option>
              <option value="To-The-Point">To-The-Point</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-colors">
              <input
                type="checkbox"
                checked={sessionOnly}
                onChange={(e) => handleSessionToggle(e.target.checked)}
                disabled={!currentSessionId}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className={`text-sm font-medium ${currentSessionId ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                Session Only
              </span>
            </label>
          </div>
        </div>

        {/* Session status indicator */}
        {currentSessionId && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
              {sessionOnly ? (
                <>🔍 Session-only mode active. Only searching session documents.</>
              ) : (
                <>📚 Hybrid mode active. Searching both permanent and session documents.</>
              )}
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-300 text-center mt-1">
              Session ID: {currentSessionId}
            </p>
            {/* Add a clear session button */}
            <div className="flex justify-center mt-2">
              <button
                onClick={handleClearSession}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Clear Session
              </button>
            </div>
          </div>
        )}

        {!currentSessionId && sessionOnly && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 text-center">
              ⚠️ No active session. Upload a session document first to use session-only mode.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Ask me anything about your documents
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                I'll search through your uploaded files to find answers
              </p>
              {currentSessionId && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    <strong>Session Active:</strong> {sessionOnly ? 
                      "I will only search through documents uploaded during this session." : 
                      "I will search through both permanent documents and session documents."}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              {currentSessionId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {sessionOnly ? 
                    "Searching in session documents only..." : 
                    "Searching in both permanent and session documents..."}
                </p>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              sessionOnly && currentSessionId
                ? "Ask a question about your session documents..." 
                : currentSessionId
                ? "Ask a question about all your documents..."
                : "Ask a question about your documents..."
            }
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || (sessionOnly && !currentSessionId)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        
        {currentSessionId && (
          <div className="mt-2 flex items-center justify-center">
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
              {sessionOnly ? '🔍 Session-only search' : '📚 Hybrid search (Permanent + Session)'}
            </span>
          </div>
        )}

        {sessionOnly && !currentSessionId && (
          <div className="mt-2 flex items-center justify-center">
            <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
              ⚠️ Upload a session document first
            </span>
          </div>
        )}
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.type === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`p-2 rounded-full ${isUser ? 'bg-blue-600' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        )}
      </div>

      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`rounded-2xl p-4 max-w-[85%] ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>

          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sources:</p>
              {message.sources.map((source, idx) => (
                <div
                  key={idx}
                  className="text-sm p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {source.filename}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Page {source.page} • {source.document_type} • Score: {source.similarity_score}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {source.content_preview}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}