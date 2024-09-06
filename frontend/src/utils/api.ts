import axios from 'axios';
import { Expense, Category } from '@/types';

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