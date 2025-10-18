import api from './api';

const kpiService = {
  async list() {
    const res = await api.get('/kpi');
    return res.data || [];
  },

  async create(payload) {
    const res = await api.post('/kpi', payload);
    return res.data;
  },

  async getAgences() {
    const res = await api.get('/kpi/agences');
    return res.data || [];
  },

  async getCategories() {
    const res = await api.get('/kpi/categories');
    return res.data || [];
  },

  async getExistingData(dateKey, agenceId) {
    const res = await api.get(`/kpi/existing?dateKey=${dateKey}&agenceId=${agenceId}`);
    return res.data || [];
  }
};

export default kpiService;
