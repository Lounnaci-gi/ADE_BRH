import api from './api';

const categoriesService = {
  async list() {
    try {
      const res = await api.get('/categories');
      return res.data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      throw error;
    }
  },

  async create(payload) {
    const res = await api.post('/categories', payload);
    return res.data;
  },

  async update(id, payload) {
    const res = await api.put(`/categories/${id}`, payload);
    return res.data;
  },

  async remove(id) {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  }
};

export default categoriesService;
