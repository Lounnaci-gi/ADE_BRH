import api from './api';
import axios from 'axios';

const categoriesService = {
  async list() {
    try {
      // Essayer d'abord avec l'instance API normale (avec auth)
      const res = await api.get('/categories');
      return res.data || [];
    } catch (error) {
      console.log('Erreur avec auth, essai sans auth:', error);
      try {
        // Si ça échoue, essayer sans authentification
        const res = await axios.get('http://localhost:5000/api/categories');
        return res.data || [];
      } catch (error2) {
        console.error('Erreur sans auth aussi:', error2);
        throw error2;
      }
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
