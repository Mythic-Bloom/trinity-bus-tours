
export const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const CONFIG = {
  API_BASE,
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LANGUAGE: 'en',
  SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
  SUPABASE_KEY: process.env.REACT_APP_SUPABASE_KEY
};
