// frontend/src/services/appointments.js
import api from './api';

export const appointmentsService = {
  // Basic CRUD
  list: async (params = {}) => {
    const resp = await api.get('/appointments_app/appointments/', { params });
    return resp.data;
  },
  
  get: async (id) => {
    const resp = await api.get(`/appointments_app/appointments/${id}/`);
    return resp.data;
  },
  
  create: async (data) => {
    const resp = await api.post('/appointments_app/appointments/', data);
    return resp.data;
  },
  
  update: async (id, data) => {
    const resp = await api.put(`/appointments_app/appointments/${id}/`, data);
    return resp.data;
  },
  
  delete: async (id) => {
    const resp = await api.delete(`/appointments_app/appointments/${id}/`);
    return resp.data;
  },
  
  // Role-specific appointments
  getPatientAppointments: async (patientId) => {
    const resp = await api.get(`/appointments_app/appointments/?patient=${patientId}`);
    return resp.data;
  },
  
  getProviderAppointments: async (providerId) => {
    const resp = await api.get(`/appointments_app/appointments/?provider=${providerId}`);
    return resp.data;
  },
  
  // Appointment actions
  confirm: async (id, confirmed_date = null) => {
    const resp = await api.post(`/appointments_app/appointments/${id}/confirm/`, { confirmed_date });
    return resp.data;
  },
  
  cancel: async (id, reason = '') => {
    const resp = await api.post(`/appointments_app/appointments/${id}/cancel/`, { reason });
    return resp.data;
  },
  
  complete: async (id) => {
    const resp = await api.post(`/appointments_app/appointments/${id}/complete/`);
    return resp.data;
  },
  
  proposeTime: async (id, proposed_date, message = '') => {
    const resp = await api.post(`/appointments_app/appointments/${id}/propose_time/`, { proposed_date, message });
    return resp.data;
  },
  
  reschedule: async (id, new_date, reason = '') => {
    const resp = await api.post(`/appointments_app/appointments/${id}/reschedule/`, { new_date, reason });
    return resp.data;
  },
  
  addMessage: async (id, message) => {
    const resp = await api.post(`/appointments_app/appointments/${id}/add_message/`, { message });
    return resp.data;
  },
  
  getMessages: async (id) => {
    const resp = await api.get(`/appointments_app/appointments/${id}/messages/`);
    return resp.data;
  },
  
  submitFeedback: async (id, rating, feedback) => {
    const resp = await api.post(`/appointments_app/appointments/${id}/feedback/`, { rating, feedback });
    return resp.data;
  },
  
  // Dashboard endpoints
  getUpcoming: async () => {
    const resp = await api.get('/appointments_app/appointments/upcoming/');
    return resp.data;
  },
  
  getToday: async () => {
    const resp = await api.get('/appointments_app/appointments/today/');
    return resp.data;
  }
};

export default appointmentsService;