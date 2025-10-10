import api from './api';

const agenceService = {
  async list() {
    const res = await api.get('/agences');
    return res.data || [];
  },
  async create(payload) {
    const res = await api.post('/agences', payload);
    return res.data;
  },
  async update(id, payload) {
    const res = await api.put(`/agences/${id}`, payload);
    return res.data;
  }
};

export default agenceService;


