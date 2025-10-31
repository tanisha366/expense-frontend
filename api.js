import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const getExpenses = () => API.get('/expenses');
export const addExpense = (expense) => API.post('/expenses', expense);
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);
