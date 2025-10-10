import api from './api';
import authService from './authService';

const userService = {
  async list() {
    const user = authService.getCurrentUser();
    const res = await api.get('/users', { 
      headers: { 
        'X-Role': user?.role || '', 
        'X-User-Id': user?.id || ''
      } 
    });
    return res.data || [];
  },
  async create(payload) {
    const user = authService.getCurrentUser();
    const res = await api.post('/users', payload, { headers: { 'X-Role': user?.role || '' } });
    return res.data;
  },
  async me() {
    const res = await api.get('/me');
    return res.data;
  },
  async updateProfile(payload) {
    const res = await api.put('/me', payload);
    return res.data;
  },
  async updateOwnProfile(payload) {
    const user = authService.getCurrentUser();
    const res = await api.put('/users/profile', payload, { 
      headers: { 
        'X-Role': user?.role || '', 
        'X-User-Id': user?.id || ''
      } 
    });
    return res.data;
  },
  async updatePassword(payload) {
    const res = await api.post('/me/password', payload);
    return res.data;
  },
  async update(id, payload) {
    const user = authService.getCurrentUser();
    const res = await api.put(`/users/${id}`, payload, { 
      headers: { 'X-Role': user?.role || '' } 
    });
    return res.data;
  },
  async remove(id) {
    const user = authService.getCurrentUser();
    const res = await api.delete(`/users/${id}`, { 
      headers: { 'X-Role': user?.role || '' } 
    });
    return res.data;
  }
};

export default userService;


