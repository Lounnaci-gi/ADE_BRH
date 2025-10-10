import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const agenceService = {
  async create(agence) {
    const res = await axios.post(`${API_URL}/agences`, agence);
    return res.data;
  },
  async list() {
    const res = await axios.get(`${API_URL}/agences`);
    return res.data || [];
  },
  async update(id, agence) {
    const res = await axios.put(`${API_URL}/agences/${id}`, agence);
    return res.data;
  }
};

export default agenceService;


