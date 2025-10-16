import api from './api';
import authService from './authService';

const communesService = {
  async list() {
    const res = await api.get('/communes');
    return res.data || [];
  },

  async create(payload) {
    const user = authService.getCurrentUser();
    const res = await api.post('/communes', payload, {
      headers: { 'X-Role': user?.role || 'Administrateur' }
    });
    return res.data;
  },

  async update(id, payload) {
    const user = authService.getCurrentUser();
    const res = await api.put(`/communes/${id}`, payload, {
      headers: { 'X-Role': user?.role || 'Administrateur' }
    });
    return res.data;
  },

  async remove(id) {
    const user = authService.getCurrentUser();      
    const res = await api.delete(`/communes/${id}`, {
      headers: { 'X-Role': user?.role || 'Administrateur' }
    });
    return res.data;
  },

  async getAgences() {
    const res = await api.get('/communes/agences');
    return res.data || [];
  },

  async getCount() {
    const res = await api.get('/communes/count');
    return res.data?.count ?? 0;
  }
};

export default communesService;
