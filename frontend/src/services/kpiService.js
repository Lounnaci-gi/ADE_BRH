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
  },

  async getObjectives(agenceId, year, month) {
    const res = await api.get(`/kpi/objectives?agenceId=${agenceId}&year=${year}&month=${month}`);
    return res.data;
  },

  async getSummary(agenceId, dateKey) {
    const res = await api.get(`/kpi/summary?agenceId=${agenceId}&dateKey=${dateKey}`);
    return res.data;
  },

  async getAllObjectives(agenceId) {
    const res = await api.get(`/kpi/objectives?agenceId=${agenceId}`);
    return res.data || [];
  },

  async getGlobalSummary(dateKey) {
    const res = await api.get(`/kpi/global-summary?dateKey=${dateKey}`);
    return res.data;
  },

  async getDetailedData(agenceId, startDate, endDate) {
    const res = await api.get(`/kpi/detailed-data?agenceId=${agenceId}&startDate=${startDate}&endDate=${endDate}`);
    return res.data;
  },

  async getHighestDailyRate(date) {
    const res = await api.get(`/kpi/highest-daily-rate${date ? `?date=${date}` : ''}`);
    return res.data;
  },

  async getHighestDailyRateByCentre(date) {
    const res = await api.get(`/kpi/highest-daily-rate-centre${date ? `?date=${date}` : ''}`);
    return res.data;
  },

  async getHighestMonthlyAverageRate() {
    const res = await api.get('/kpi/highest-monthly-average-rate');
    return res.data;
  },

  async getHighestMonthlyAverageRateByCentre() {
    const res = await api.get('/kpi/highest-monthly-average-rate-centre');
    return res.data;
  },

  async getTop3AgencesMonth() {
    const res = await api.get('/kpi/top-3-agences-month');
    return res.data;
  }
};

export default kpiService;
