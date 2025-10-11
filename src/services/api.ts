import axios from 'axios';

const API_BASE_URL = 'https://akhyar919-documind.hf.space';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadDocument = async (file: File, isPermanent: boolean = true) => {
  const formData = new FormData();
  formData.append('file', file);
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
