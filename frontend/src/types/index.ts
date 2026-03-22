export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Entertainment'
  | 'Health'
  | 'Shopping'
  | 'Utilities'
  | 'Education'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transport',
  'Entertainment',
  'Health',
  'Shopping',
  'Utilities',
  'Education',
  'Other',
];

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Expense {
  _id: string;
  userId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
}

export interface ExpenseFormData {
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string;
}

export interface Budget {
  _id: string;
  userId: string;
  category: string;
  limit: number;
  month: number;
  year: number;
}

export interface BudgetFormData {
  category: string;
  limit: number;
  month: number;
  year: number;
}
