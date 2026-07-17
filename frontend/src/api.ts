import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({ baseURL: API_URL });

export function authHeaders(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
  }
  return fallback;
}
