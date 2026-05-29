import axios from 'axios';

// cria ponte com backend
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3030',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const isPortalPath = typeof window !== 'undefined' && window.location.pathname.includes('/portal');
  const token = isPortalPath 
    ? (localStorage.getItem('portal_token') || localStorage.getItem('token'))
    : (localStorage.getItem('token') || localStorage.getItem('portal_token'));
  
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