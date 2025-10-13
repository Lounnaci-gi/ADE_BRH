import api from './api';
import authService from './authService';

const centresService = {
  // Lister tous les centres
  list: () => {
    const user = authService.getCurrentUser();
    return api.get('/centres', { 
      headers: { 'X-Role': user?.role || '' } 
    });
  },

  // Créer un centre
  create: (centreData) => {
    const user = authService.getCurrentUser();
    return api.post('/centres', centreData, { 
      headers: { 'X-Role': user?.role || '' } 
    });
  },

  // Modifier un centre
  update: (id, centreData) => {
    const user = authService.getCurrentUser();
    return api.put(`/centres/${id}`, centreData, { 
      headers: { 'X-Role': user?.role || '' } 
    });
  },

  // Supprimer un centre
  remove: (id) => {
    const user = authService.getCurrentUser();
    return api.delete(`/centres/${id}`, { 
      headers: { 'X-Role': user?.role || '' } 
    });
  },

  // Obtenir le nombre total de centres
  getCount: () => {
    const user = authService.getCurrentUser();
    return api.get('/centres/count', { 
      headers: { 'X-Role': user?.role || '' } 
    });
  }
};

export default centresService;
