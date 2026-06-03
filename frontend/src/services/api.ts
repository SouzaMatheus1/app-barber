import axios from 'axios';

// cria ponte com backend
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3030',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Identifica se a origem da requisição é o Portal (por subdomínio ou caminho legado)
const checkIsPortal = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.startsWith('portal') || window.location.pathname.includes('/portal');
};

// Interceptor de Request: injeção correta do token com base no contexto
api.interceptors.request.use((config) => {
  const isPortal = checkIsPortal();
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

// Interceptor de Response: tratamento centralizado de erro de autenticação (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isPortal = checkIsPortal();
      
      if (isPortal) {
        localStorage.removeItem('portal_token');
        localStorage.removeItem('portal_cliente');
        
        const isPortalSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('portal');
        let slug = '';
        
        if (isPortalSubdomain) {
          // No subdomínio, o slug é o primeiro segmento da URL (ex: portal.localhost:3000/minha-barbearia -> minha-barbearia)
          const parts = window.location.pathname.split('/').filter(Boolean);
          slug = parts[0] || '';
        } else {
          // No cenário legado, extrai o slug via Regex de /portal/:slug
          const match = window.location.pathname.match(/\/portal\/([^/]+)/);
          slug = match ? match[1] : '';
        }
        
        window.location.href = isPortalSubdomain ? `/${slug}/login` : `/portal/${slug}/login`;
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
