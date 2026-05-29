import axios from 'axios';

// cria ponte com backend
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3030',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const isPortal = typeof window !== 'undefined' && window.location.pathname.includes('/portal');
  const token = localStorage.getItem(isPortal ? 'portal_token' : 'token');
  
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isPortal = typeof window !== 'undefined' && window.location.pathname.includes('/portal');
      
      if (isPortal) {
        localStorage.removeItem('portal_token');
        localStorage.removeItem('portal_cliente');
        
        const match = window.location.pathname.match(/\/portal\/([^/]+)/);
        const slug = match ? match[1] : '';
        window.location.href = `/portal/${slug}/login`;
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);