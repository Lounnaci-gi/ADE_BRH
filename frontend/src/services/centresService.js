import api from './api';
import authService from './authService';

const centresService = {
  // Lister tous les centres
  list: () => {
    return api.get('/centres');
  },

  // Créer un centre
  create: (centreData) => {
    const user = authService.getCurrentUser();
    return api.post('/centres', centreData, { 
      headers: { 'X-Role': user?.role || 'Administrateur' } 
    });
  },

  // Modifier un centre
  update: (id, centreData) => {
    const user = authService.getCurrentUser();
    return api.put(`/centres/${id}`, centreData, { 
      headers: { 'X-Role': user?.role || 'Administrateur' } 
    });
  },

  // Supprimer un centre
  remove: (id) => {
    const user = authService.getCurrentUser();
    return api.delete(`/centres/${id}`, { 
      headers: { 'X-Role': user?.role || 'Administrateur' } 
    });
  },

  // Obtenir le nombre total de centres
  getCount: () => {
    return api.get('/centres/count');
  }
};

export default centresService;
