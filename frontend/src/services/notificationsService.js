import api from './api';

const notificationsService = {
  async getUnreadCount() {
    const res = await api.get('/notifications/unread-count');
    return res.data?.count ?? 0;
  },
  async list({ limit = 10 } = {}) {
    const res = await api.get(`/notifications?limit=${limit}`);
    return res.data || [];
  },
  async markAllRead() {
    await api.post('/notifications/mark-all-read');
  },
  async getAgenciesStatus() {
    const res = await api.get('/notifications/agencies-status');
    return res.data || { agencies: [], summary: { total: 0, completed: 0, pending: 0 } };
  }
};

export default notificationsService;


