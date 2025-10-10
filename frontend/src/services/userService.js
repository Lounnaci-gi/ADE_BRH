import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const userService = {
  async list() {
    const res = await axios.get(`${API_URL}/users`);
    return res.data || [];
  },
  async create(payload) {
    const user = authService.getCurrentUser();
    const res = await axios.post(`${API_URL}/users`, payload, { headers: { 'X-Role': user?.role || '' } });
    return res.data;
  },
  async me() {
    const res = await axios.get(`${API_URL}/me`);
    return res.data;
  },
  async updateProfile(payload) {
    const res = await axios.put(`${API_URL}/me`, payload);
    return res.data;
  },
  async updatePassword(payload) {
    const res = await axios.post(`${API_URL}/me/password`, payload);
    return res.data;
  }
};

export default userService;


