import api from './api';
import authService from './authService';

const agenceService = {
  async list() {
    console.log('Calling agenceService.list()');
    
    try {
      const res = await api.get('/agences');
      console.log('API response:', res.data);
      return res.data || [];
    } catch (error) {
      console.error('Error in agenceService.list:', error);
      throw error;
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
  },
  async getCount() {
    const user = authService.getCurrentUser();
    const response = await api.get('/agences/count', {
      headers: {
        'X-Role': user?.role || 'Administrateur',
        'X-User-Agence': user?.agenceId || ''
      }
    });
    return response.data.count;
  }
};

export default agenceService;


