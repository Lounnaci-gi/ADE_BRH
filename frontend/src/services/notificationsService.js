import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const notificationsService = {
  async getUnreadCount() {
    const res = await axios.get(`${API_URL}/notifications/unread-count`);
    return res.data?.count ?? 0;
  },
  async list({ limit = 10 } = {}) {
    const res = await axios.get(`${API_URL}/notifications?limit=${limit}`);
    return res.data || [];
  },
  async markAllRead() {
    await axios.post(`${API_URL}/notifications/mark-all-read`);
  }
};

export default notificationsService;


