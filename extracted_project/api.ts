
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxied or absolute URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for JWT tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('autoserv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
