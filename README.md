# DocuMind - AI Document Chat Application

A modern, interactive React application for document-based question answering using RAG (Retrieval-Augmented Generation).

## Features

- **Firebase Authentication**: Secure user registration and login
- **Document Management**: Upload and manage PDF, DOCX, TXT, and image files
- **Smart Chat Interface**: Query your documents with AI-powered responses
- **Multiple Query Modes**:
  - Explain: Detailed explanations
  - Summarize: Key points summary
  - To-The-Point: Direct answers
- **Session Management**: Permanent and session-based document storage
- **Dark/Light Theme**: Automatic theme detection with manual toggle
- **Responsive Design**: Works seamlessly on all devices

## Setup Instructions

### 1. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password authentication
3. Copy your Firebase config values
4. Update `.env` file with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Authentication**: Firebase Auth
- **API Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite

## Backend Integration

This application connects to a FastAPI backend at:
`https://akhyar919-documind.hf.space/`

API endpoints include:
- `POST /upload` - Upload documents
- `POST /query` - Query documents
- `GET /documents` - List user documents
- `DELETE /documents/{filename}` - Delete documents

## Project Structure

```
src/
├── components/
│   ├── ChatInterface.tsx      # Chat UI with query modes
│   ├── DocumentList.tsx        # Document management
│   ├── FileUpload.tsx          # Drag-and-drop upload
│   ├── Header.tsx              # App header with theme toggle
│   └── ProtectedRoute.tsx      # Route protection
├── contexts/
│   ├── AuthContext.tsx         # Authentication state
│   └── ThemeContext.tsx        # Theme management
├── pages/
│   ├── Dashboard.tsx           # Main application page
│   ├── Login.tsx               # Login page
│   └── Register.tsx            # Registration page
├── services/
│   └── api.ts                  # API integration
├── config/
│   └── firebase.ts             # Firebase configuration
├── App.tsx                     # Main app component
└── main.tsx                    # Entry point
```

## Features in Detail

### Document Upload
- Drag-and-drop interface
- File type validation
- Permanent vs session storage options
- Visual upload progress

### Chat Interface
- Real-time query responses
- Source document references
- Adjustable query modes
- Session-only filtering option

### Theme System
- Automatic dark mode detection
- Manual theme toggle
- Smooth color transitions
- Persistent theme preference

## License

MIT
