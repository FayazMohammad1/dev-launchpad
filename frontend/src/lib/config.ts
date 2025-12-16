const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

export const TEMPLATE_URL = `${API_BASE}/template`;
export const CHAT_URL = `${API_BASE}/chat`;

export default {
  API_BASE,
  TEMPLATE_URL,
  CHAT_URL,
};
