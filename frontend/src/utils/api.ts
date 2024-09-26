import axios from 'axios';
import { Expense, Category, BudgetGoal } from '@/types';

const API_URL = 'http://localhost:8080/api';

export const getExpenses = async (): Promise<Expense[]> => {
  const response = await axios.get(`${API_URL}/expenses`);
  return response.data;
};

export const addExpense = async (expense: Omit<Expense, '_id' | 'category'>): Promise<Expense> => {
  const response = await axios.post(`${API_URL}/expenses`, expense);
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get(`${API_URL}/categories`);
  return response.data;
};

export const addCategory = async (category: Omit<Category, '_id'>): Promise<Category> => {
    const response = await axios.post(`${API_URL}/categories`, category);
    return response.data;
  };
  
  export const deleteCategory = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/categories/${id}`);
  };

  export const updateExpense = async (expense: Expense): Promise<Expense> => {
    const response = await axios.put(`${API_URL}/expenses/${expense._id}`, expense);
    return response.data;
  };

  export const updateCategory = async (category: Category): Promise<Category> => {
    const response = await axios.put(`${API_URL}/categories/${category._id}`, category);
    return response.data;
  };

  export const deleteExpenses = async (expenseIds: string[]): Promise<void> => {
    await axios.post(`${API_URL}/expenses/delete`, { ids: expenseIds });
  };

  // Bill Processing API

export const uploadBill = async (formData: FormData): Promise<any> => {
  const response = await axios.post(`${API_URL}/bills`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getBillDetails = async (billId: string): Promise<any> => {
  const response = await axios.get(`${API_URL}/bills/${billId}`);
  return response.data;
};

export const confirmExpenses = async (billId: string, expenses: Expense[]): Promise<void> => {
  await axios.post(`${API_URL}/bills/${billId}/confirm`, expenses);
};

export const updateBillExpense = async (billId: string, expense: Expense): Promise<void> => {
  await axios.put(`${API_URL}/bills/${billId}/expenses/${expense._id}`, expense);
};

export const getBudgetGoals = async (): Promise<BudgetGoal[]> => {
  const response = await axios.get(`${API_URL}/budget-goals`);
  return response.data;
};

export const addBudgetGoal = async (goal: Omit<BudgetGoal, '_id'>): Promise<BudgetGoal> => {
  const response = await axios.post(`${API_URL}/budget-goals`, goal);
  return response.data;
};

export const updateBudgetGoal = async (goal: BudgetGoal): Promise<BudgetGoal> => {
  const response = await axios.put(`${API_URL}/budget-goals/${goal._id}`, goal);
  return response.data;
};

export const deleteBudgetGoal = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/budget-goals/${id}`);
};