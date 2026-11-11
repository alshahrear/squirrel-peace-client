export const LOCAL_API = 'http://localhost:5000';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || LOCAL_API).replace(/\/+$/, '');

export default API_BASE;