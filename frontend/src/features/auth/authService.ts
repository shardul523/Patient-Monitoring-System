// frontend/src/features/auth/authService.ts
import api from '../../services/api';
import { LoginCredentials, RegisterCredentials } from './types'; // We'll define types

const API_URL = '/auth/';

const register = async (userData: RegisterCredentials) => {
  const response = await api.post(API_URL + 'register', userData);
  // Assuming backend returns { user: ..., message: ... } on successful registration
  // No token is returned on register, user needs to login
  return response.data;
};

const login = async (userData: LoginCredentials) => {
  const response = await api.post(API_URL + 'login', userData);
  if (response.data.accessToken) {
    localStorage.setItem('pms_token', response.data.accessToken);
    localStorage.setItem('pms_user', JSON.stringify(response.data.user));
  }
  return response.data; // { accessToken: string, user: User }
};

const logout = () => {
  localStorage.removeItem('pms_token');
  localStorage.removeItem('pms_user');
};

const authService = {
  register,
  login,
  logout,
};

export default authService;