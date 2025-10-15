import axios from 'axios';
import authService from './authService';

const baseURL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const instance = axios.create({
  baseURL
});

instance.interceptors.request.use((config) => {
  const user = authService.getCurrentUser();
  console.log('API interceptor - Current user:', user);
  
  // Toujours ajouter le rôle par défaut si pas d'utilisateur connecté
  config.headers['X-Role'] = user?.role || 'Administrateur';
  
  if (user?.agenceId) {
    config.headers['X-User-Agence'] = user.agenceId;
  }
  
  console.log('API interceptor - Headers:', config.headers);
  return config;
});

export default instance;


