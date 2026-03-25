import { api } from './api';

export const authService = {
  async login(email: string, senha: string) {
    const response = await api.post('/login', { email, senha });
    return response.data; // Espera { token, user: { ... } } ou algo similar
  }
};
