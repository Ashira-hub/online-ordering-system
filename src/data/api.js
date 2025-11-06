import axios from 'axios';

// Base URL for Platzi Fake Store API (EscuelaJS)
// You can override via Vite env: VITE_PLATZI_API=https://api.escuelajs.co/api/v1
const BASE_URL = import.meta.env?.VITE_PLATZI_API || 'https://api.escuelajs.co/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export default api;
