import axios from 'axios';
import authService from './authService';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
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


