import axios from 'axios';
import authService from './authService';

const baseURL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const instance = axios.create({
  baseURL
});

instance.interceptors.request.use((config) => {
  const user = authService.getCurrentUser();
  // SÉCURITÉ: Ne pas définir de rôle par défaut - nécessite une authentification réelle
  if (!user || !user.role) {
    // Si pas d'utilisateur, ne pas ajouter de headers d'authentification
    // Le serveur doit rejeter ces requêtes
    return config;
  }
  config.headers['X-Role'] = user.role;
  if (user.id) config.headers['X-User-Id'] = String(user.id);
  if (user.agenceId) config.headers['X-User-Agence'] = user.agenceId;
  return config;
});

export default instance;


