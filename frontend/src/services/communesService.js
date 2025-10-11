import api from './api';

const communesService = {
  async list() {
    const res = await api.get('/communes');
    return res.data || [];
  },

  async create(payload) {
    const res = await api.post('/communes', payload);
    return res.data;
  },

  async update(id, payload) {
    const res = await api.put(`/communes/${id}`, payload);
    return res.data;
  },

  async remove(id) {
    const res = await api.delete(`/communes/${id}`);
    return res.data;
  },

  async getAgences() {
    const res = await api.get('/communes/agences');
    return res.data || [];
  }
};

export default communesService;
