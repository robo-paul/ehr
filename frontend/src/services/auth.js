// src/services/auth.js
import api from './api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  registerPatient: async (userData) => {
    const response = await api.post('/auth/register/patient/', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  registerDoctor: async (userData) => {
    const response = await api.post('/auth/register/doctor/', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  registerStaff: async (userData) => {
    const response = await api.post('/auth/register/staff/', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  hasRole: (role) => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.user_type === role;
  },

  isMedicalStaff: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const staffRoles = ['doctor', 'nurse', 'pharmacist', 'radiologist', 'labscientist', 'admin'];
    return staffRoles.includes(user?.user_type);
  },

  isVerified: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.is_verified || false;
  }
};