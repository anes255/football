import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://fotball-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  verify: () => api.get('/auth/verify'),
};

export const teamsAPI = {
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
};

export const tournamentsAPI = {
  getAll: () => api.get('/tournaments'),
  getActive: () => api.get('/tournaments/active'),
  getById: (id) => api.get(`/tournaments/${id}`),
  getMatches: (id) => api.get(`/tournaments/${id}/matches`),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
};

export const matchesAPI = {
  getAll: () => api.get('/matches'),
  getVisible: () => api.get('/matches/visible'),
  getUpcoming: () => api.get('/matches/upcoming'),
  getById: (id) => api.get(`/matches/${id}`),
  getByTeam: (teamId) => api.get(`/matches/team/${teamId}`),
  getByTournament: (id) => api.get(`/matches/tournament/${id}`),
  getByTournamentVisible: (id) => api.get(`/matches/tournament/${id}/visible`),
  canPredict: (id) => api.get(`/matches/${id}/can-predict`),
  create: (data) => api.post('/matches', data),
  update: (id, data) => api.put(`/matches/${id}`, data),
  setResult: (id, data) => api.put(`/matches/${id}/result`, data),
  delete: (id) => api.delete(`/matches/${id}`),
};

export const predictionsAPI = {
  getMyPredictions: () => api.get('/predictions'),
  getByMatch: (matchId) => api.get(`/predictions/match/${matchId}`),
  makePrediction: (data) => api.post('/predictions', data),
};

export const leaderboardAPI = {
  getAll: () => api.get('/leaderboard'),
  getUserPredictions: (userId) => api.get(`/leaderboard/user/${userId}`),
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getScoringRules: () => api.get('/admin/scoring-rules'),
  updateScoringRules: (data) => api.put('/admin/scoring-rules', data),
};

export const validateAlgerianPhone = (phone) => {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(05|06|07)[0-9]{8}$/.test(cleaned);
};

export default api;
