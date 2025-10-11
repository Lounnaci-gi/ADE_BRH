import api from './api';
import authService from './authService';

const objectivesService = {
  async list() {
    const user = authService.getCurrentUser();
    const res = await api.get('/objectives', {
      headers: {
        'X-Role': user?.role || '',
        'X-User-Id': user?.id || ''
      }
    });
    return res.data || [];
  },

  async getAgences() {
    const user = authService.getCurrentUser();
    const res = await api.get('/objectives/agences', {
      headers: {
        'X-Role': user?.role || '',
        'X-User-Id': user?.id || ''
      }
    });
    return res.data || [];
  },

  async save(payload) {
    const user = authService.getCurrentUser();
    const res = await api.post('/objectives', payload, {
      headers: {
        'X-Role': user?.role || '',
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
        'X-Role': user?.role || '',
        'X-User-Id': user?.id || ''
      }
    });
    return res.data;
  }
};

export default objectivesService;
