import axios from 'axios';

// cria ponte com backend
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3030',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Define qual token usar dependendo de onde o usuário está navegando
  const isPortalView = window.location.pathname.startsWith('/portal');
  const token = localStorage.getItem(isPortalView ? 'portal_token' : 'token');
  
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});