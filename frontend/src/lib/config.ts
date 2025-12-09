const API_BASE = (import.meta as any).env.VITE_API_URL || 'https://bug-free-giggle-wpp7pqprprqc9j5r-3000.app.github.dev';

export const TEMPLATE_URL = `${API_BASE}/template`;
export const CHAT_URL = `${API_BASE}/chat`;

export default {
  API_BASE,
  TEMPLATE_URL,
  CHAT_URL,
};
