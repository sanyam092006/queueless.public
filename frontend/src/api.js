import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('queueless_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const onAuthPage = ['/login', '/register'].includes(window.location.pathname);
    if (err.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem('queueless_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Turns any axios error into a readable message.
export const errMsg = (err) =>
  err.response?.data?.message || (err.request ? 'Cannot reach the server. Check your connection and API URL.' : err.message);

export default api;
