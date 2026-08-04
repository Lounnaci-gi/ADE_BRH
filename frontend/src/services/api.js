import axios from 'axios';
import authService from './authService';

const baseURL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const instance = axios.create({
  baseURL
});

instance.interceptors.request.use((config) => {
  // Contourner la page d'avertissement HTML d'ngrok (gratuit)
  config.headers['ngrok-skip-browser-warning'] = 'true';

  const user = authService.getCurrentUser();
  if (!user || !user.role) {
    return config;
  }
  config.headers['X-Role'] = user.role;
  if (user.id) config.headers['X-User-Id'] = String(user.id);
  if (user.agenceId) config.headers['X-User-Agence'] = user.agenceId;
  return config;
});

export default instance;


