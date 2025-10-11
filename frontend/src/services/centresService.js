import api from './api';

const centresService = {
  // Lister tous les centres
  list: () => {
    return api.get('/centres');
  },

  // Créer un centre
  create: (centreData) => {
    return api.post('/centres', centreData);
  },

  // Modifier un centre
  update: (id, centreData) => {
    return api.put(`/centres/${id}`, centreData);
  },

  // Supprimer un centre
  remove: (id) => {
    return api.delete(`/centres/${id}`);
  }
};

export default centresService;
