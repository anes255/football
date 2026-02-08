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
  getTeams: (id) => api.get(`/tournaments/${id}/teams`),
  getFormats: () => api.get('/tournaments/formats'),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  // Players
  getPlayers: (tournamentId) => api.get(`/tournaments/${tournamentId}/players`),
  createPlayer: (tournamentId, data) => api.post(`/tournaments/${tournamentId}/players`, data),
  updatePlayer: (playerId, data) => api.put(`/players/${playerId}`, data),
  deletePlayer: (playerId) => api.delete(`/players/${playerId}`),
  // Player predictions
  getMyPrediction: (tournamentId) => api.get(`/tournaments/${tournamentId}/my-player-prediction`),
  savePrediction: (tournamentId, data) => api.post(`/tournaments/${tournamentId}/player-prediction`, data),
  // Admin: set winners
  setWinners: (tournamentId, data) => api.post(`/admin/tournaments/${tournamentId}/set-player-winners`, data),
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
  delete: (id) => api.delete(`/matches/${id}`),
  startMatch: (id) => api.put(`/matches/${id}/start`),
  updateScore: (id, data) => api.put(`/matches/${id}/score`, data),
  completeMatch: (id, data) => api.put(`/matches/${id}/complete`, data),
  setResult: (id, data) => api.put(`/matches/${id}/result`, data),
};

export const predictionsAPI = {
  getMyPredictions: () => api.get('/predictions'),
  makePrediction: (data) => api.post('/predictions', data),
  getUserPredictions: (userId) => api.get(`/users/${userId}/predictions`),
};

export const tournamentWinnerAPI = {
  get: (tournamentId) => api.get(`/tournament-winner/${tournamentId}`),
  predict: (data) => api.post('/tournament-winner', data),
};

export const leaderboardAPI = {
  getAll: () => api.get('/leaderboard'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getScoringRules: () => api.get('/admin/scoring-rules'),
  updateScoringRules: (data) => api.put('/admin/scoring-rules', data),
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  bulkAddTournamentTeams: (id, data) => api.post(`/admin/tournaments/${id}/teams`, data),
  getTournamentTeams: (id) => api.get(`/tournaments/${id}/teams`),
  awardTournamentWinner: (data) => api.post('/admin/award-winner', data),
};

export const validateAlgerianPhone = (phone) => {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(05|06|07)[0-9]{8}$/.test(cleaned);
};

export default api;
