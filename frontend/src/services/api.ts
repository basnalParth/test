import axios from 'axios';
import type { AuthResponse, Expense, ExpenseFilters, ExpenseFormData } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (name: string, email: string, password: string) =>
  api.post<AuthResponse>('/api/auth/register', { name, email, password });

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/api/auth/login', { email, password });

// Expenses
export const getExpenses = (filters?: ExpenseFilters) =>
  api.get<Expense[]>('/api/expenses', { params: filters });

export const getExpense = (id: string) =>
  api.get<Expense>(`/api/expenses/${id}`);

export const createExpense = (data: ExpenseFormData) =>
  api.post<Expense>('/api/expenses', data);

export const updateExpense = (id: string, data: Partial<ExpenseFormData>) =>
  api.put<Expense>(`/api/expenses/${id}`, data);

export const deleteExpense = (id: string) =>
  api.delete(`/api/expenses/${id}`);

export default api;
