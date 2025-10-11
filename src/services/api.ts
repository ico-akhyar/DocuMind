import axios from 'axios';
// ADDED: Import the Firebase auth instance
import { auth } from '../config/firebase';

const API_BASE_URL = 'https://akhyar919-documind.hf.space';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// CHANGED: The entire request interceptor is now asynchronous to handle fetching a fresh token
api.interceptors.request.use(async (config) => {
  // Get the currently signed-in user from Firebase
  const user = auth.currentUser;

  if (user) {
    // Always get a fresh ID token. Firebase handles caching for performance.
    // This ensures the token is never expired.
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // REMOVED: The old logic that used localStorage
  // const token = localStorage.getItem('authToken');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }

  return config;
});

export const uploadDocument = async (file: File, isPermanent: boolean = true) => {
  const formData = new FormData();
  formData.append('file', file);
  // NOTE: The backend expects a boolean, but FormData converts it to a string.
  // The Python backend correctly handles "true" and "false" strings.
  formData.append('is_permanent', String(isPermanent));

  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const queryDocuments = async (
  query: string,
  sessionId?: string,
  sessionOnly: boolean = false,
  queryMode: string = 'Explain'
) => {
  return api.post('/query', {
    query,
    session_id: sessionId,
    session_only: sessionOnly,
    query_mode: queryMode,
  });
};

export const getDocuments = async () => {
  return api.get('/documents');
};

export const deleteDocument = async (filename: string) => {
  return api.delete(`/documents/${filename}`);
};

export default api;
