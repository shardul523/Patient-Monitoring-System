import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
};

// Patients API
export const patientsAPI = {
  getAll: (params) => api.get('/api/patients', { params }),
  getById: (id) => api.get(`/api/patients/${id}`),
  create: (data) => api.post('/api/patients', data),
  update: (id, data) => api.put(`/api/patients/${id}`, data),
  delete: (id) => api.delete(`/api/patients/${id}`),
  assignDoctor: (id, doctorId) => api.post(`/api/patients/${id}/assign-doctor`, { doctorId }),
};

// Vital Signs API
export const vitalsAPI = {
  getByPatient: (patientId, params) => api.get(`/api/vitals/patient/${patientId}`, { params }),
  getLatest: (patientId) => api.get(`/api/vitals/patient/${patientId}/latest`),
  create: (data) => api.post('/api/vitals', data),
  getTrends: (patientId, params) => api.get(`/api/vitals/patient/${patientId}/trends`, { params }),
  bulkCreate: (records) => api.post('/api/vitals/bulk', { records }),
};

// Alerts API
export const alertsAPI = {
  getAll: (params) => api.get('/api/alerts', { params }),
  getById: (id) => api.get(`/api/alerts/${id}`),
  getByPatient: (patientId, params) => api.get(`/api/alerts/patient/${patientId}`, { params }),
  acknowledge: (id) => api.post(`/api/alerts/${id}/acknowledge`),
  resolve: (id, resolution) => api.post(`/api/alerts/${id}/resolve`, { resolution }),
  escalate: (id, data) => api.post(`/api/alerts/${id}/escalate`, data),
  getStats: (params) => api.get('/api/alerts/stats/summary', { params }),
  getNotifications: () => api.get('/api/alerts/notifications'),
  getUnreadCount: () => api.get('/api/alerts/notifications/unread-count'),
  markAsRead: (id) => api.put(`/api/alerts/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/alerts/notifications/read-all'),
};

export default api;