import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const agenceService = {
  async create(agence) {
    const user = authService.getCurrentUser();
    const res = await axios.post(`${API_URL}/agences`, agence, { headers: { 'X-Role': user?.role || '' } });
    return res.data;
  },
  async list() {
    const res = await axios.get(`${API_URL}/agences`);
    return res.data || [];
  },
  async update(id, agence) {
    const user = authService.getCurrentUser();
    const res = await axios.put(`${API_URL}/agences/${id}`, agence, { headers: { 'X-Role': user?.role || '' } });
    return res.data;
  }
};

export default agenceService;


