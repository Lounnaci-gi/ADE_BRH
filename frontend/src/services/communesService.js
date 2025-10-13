import api from './api';
import authService from './authService';

const communesService = {
  async list() {
    const user = authService.getCurrentUser();
    const roleHeader = user?.role === 'Administrateur'
      ? 'Administrateur'
      : (user?.role?.toLowerCase?.().includes('admin') ? 'Administrateur' : (user?.role || ''));
    const res = await api.get('/communes', {
      headers: { 'X-Role': roleHeader }
    });
    return res.data || [];
  },

  async create(payload) {
    const user = authService.getCurrentUser();
    const roleHeader = user?.role === 'Administrateur'
      ? 'Administrateur'
      : (user?.role?.toLowerCase?.().includes('admin') ? 'Administrateur' : (user?.role || ''));
    const res = await api.post('/communes', payload, {
      headers: { 'X-Role': roleHeader }
    });
    return res.data;
  },

  async update(id, payload) {
    const user = authService.getCurrentUser();
    const roleHeader = user?.role === 'Administrateur'
      ? 'Administrateur'
      : (user?.role?.toLowerCase?.().includes('admin') ? 'Administrateur' : (user?.role || ''));
    const res = await api.put(`/communes/${id}`, payload, {
      headers: { 'X-Role': roleHeader }
    });
    return res.data;
  },

  async remove(id) {
    const user = authService.getCurrentUser();
    const roleHeader = user?.role === 'Administrateur'
      ? 'Administrateur'
      : (user?.role?.toLowerCase?.().includes('admin') ? 'Administrateur' : (user?.role || ''));
    const res = await api.delete(`/communes/${id}`, {
      headers: { 'X-Role': roleHeader }
    });
    return res.data;
  },

  async getAgences() {
    const res = await api.get('/communes/agences');
    return res.data || [];
  },

  async getCount() {
    const user = authService.getCurrentUser();
    const roleHeader = user?.role === 'Administrateur'
      ? 'Administrateur'
      : (user?.role?.toLowerCase?.().includes('admin') ? 'Administrateur' : (user?.role || ''));
    const response = await api.get('/communes/count', {
      headers: { 'X-Role': roleHeader }
    });
    return response.data.count;
  }
};

export default communesService;
