import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000, 
});

let currentToken: string | null = null;

// Track session changes synchronously
supabase.auth.onAuthStateChange((_event, session) => {
  console.log('API Service: Auth state changed, token updated');
  currentToken = session?.access_token ?? null;
});

// Initial session fetch
supabase.auth.getSession().then(({ data: { session } }) => {
  currentToken = session?.access_token ?? null;
});

api.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    };
    // Auto-fix for common network quirks
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      console.warn('API Service: Detected network glitch, recommend refresh');
    }
    
    return Promise.reject(error);
  }
);

export default api;
