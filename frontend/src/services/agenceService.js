import api from './api';
import authService from './authService';

const agenceService = {
  async list() {
    const user = authService.getCurrentUser();
    try {
      const res = await api.get('/agences', { 
        headers: { 
          'X-Role': user?.role || '', 
          'X-User-Agence': user?.agenceId || ''
        } 
      });
      return res.data || [];
    } catch (e) {
      // Surface clearer error upstream
      throw e;
    }
  },
  async create(payload) {
    const user = authService.getCurrentUser();
    const res = await api.post('/agences', payload, { 
      headers: { 'X-Role': user?.role || '' } 
    });
    return res.data;
  },
  async update(id, payload) {
    const user = authService.getCurrentUser();
    const res = await api.put(`/agences/${id}`, payload, { 
      headers: { 'X-Role': user?.role || '' } 
    });
    return res.data;
  },
  async getCentres() {
    const res = await api.get('/agences/centres');
    return res.data || [];
  }
};

export default agenceService;


