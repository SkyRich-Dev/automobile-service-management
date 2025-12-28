
import api from './api';
import { JobCard, Part, Customer, User, UserRole } from './types';

export const ServiceAPI = {
  getJobCards: () => api.get<JobCard[]>('/job-cards/'),
  getJobCard: (id: string) => api.get<JobCard>(`/job-cards/${id}/`),
  createJobCard: (data: any) => api.post('/job-cards/', data),
  updateStatus: (id: string, status: string) => api.patch(`/job-cards/${id}/`, { status }),
};

export const InventoryAPI = {
  getParts: () => api.get<Part[]>('/parts/'),
  updateStock: (id: string, qty: number) => api.patch(`/parts/${id}/`, { stock: qty }),
};

export const CRMAPI = {
  getCustomers: () => api.get<Customer[]>('/customers/'),
  getCustomerDetail: (id: string) => api.get<Customer>(`/customers/${id}/`),
};

export const StaffAPI = {
  getStaff: () => api.get<User[]>('/staff/'),
};

export const AuthAPI = {
  login: (credentials: any) => api.post('/auth/login/', credentials),
};
