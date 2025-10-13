import axios from 'axios';
import authService from './authService';

// Base URL resolution with fallback for different hosts
const resolvedBaseURL = (() => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && envUrl.trim()) return envUrl;
  // Try to use current window location host to avoid CORS/dev mismatch
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // If frontend runs on 3000, assume backend on 5000 same host
    if (origin) {
      const url = new URL(origin);
      return `${url.protocol}//${url.hostname}:5000/api`;
    }
  } catch {}
  return 'http://localhost:5000/api';
})();

const instance = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 10000,
});

instance.interceptors.request.use((config) => {
  const user = authService.getCurrentUser();
  if (user?.role) {
    config.headers['X-Role'] = user.role;
  }
  if (user?.agenceId) {
    config.headers['X-User-Agence'] = user.agenceId;
  }
  return config;
});

export default instance;


