import api from './api';
import authService from './authService';

const objectivesService = {
  async list(filters = {}) {
    const user = authService.getCurrentUser();
    const params = new URLSearchParams();
    if (filters.annee) params.append('annee', filters.annee);
    if (filters.mois) params.append('mois', filters.mois);
    
    const queryString = params.toString();
    const url = queryString ? `/objectives?${queryString}` : '/objectives';
    
    const res = await api.get(url, {
      headers: {
        'X-Role': user?.role || 'Administrateur',
        'X-User-Id': user?.id || ''
      }
    });
    return res.data || [];
  },

  async getAgences() {
    const user = authService.getCurrentUser();
    const res = await api.get('/objectives/agences', {
      headers: {
        'X-Role': user?.role || 'Administrateur',
        'X-User-Id': user?.id || ''
      }
    });
    return res.data || [];
  },


  async save(payload) {
    const user = authService.getCurrentUser();
    const res = await api.post('/objectives', payload, {
      headers: {
        'X-Role': user?.role || 'Administrateur',
        'X-User-Id': user?.id || ''
      }
    });
    return res.data;
  },

  async update(payload) {
    const user = authService.getCurrentUser();
    const res = await api.put('/objectives', payload, {
      headers: {
        'X-Role': user?.role || 'Administrateur',
        'X-User-Id': user?.id || ''
      }
    });
    return res.data;
  },

  async remove(payload) {
    const user = authService.getCurrentUser();
    const res = await api.delete('/objectives', {
      data: payload,
      headers: {
        'X-Role': user?.role || 'Administrateur',
        'X-User-Id': user?.id || ''
      }
    });
    return res.data;
  }
};

export default objectivesService;
