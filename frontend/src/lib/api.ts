import axios from 'axios';
import type {
  AuthResponse,
  Booking,
  EventInput,
  EventItem,
  User,
  VerifyResult,
} from '../types';

export const TOKEN_KEY = 'tixora-token';
export const UNAUTHORIZED_EVENT = 'tixora:unauthorized';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  timeout: 15000,
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token expired / invalid -> log the user out
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      localStorage.getItem(TOKEN_KEY) &&
      !error.config?.url?.startsWith('/auth/login')
    ) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Turns any error into a friendly message for the UI. */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; fieldErrors?: Record<string, string> }
      | undefined;
    const firstField = data?.fieldErrors ? Object.values(data.fieldErrors)[0] : undefined;
    if (firstField) return firstField;
    if (data?.message) return data.message;
    if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
  }
  return 'Something went wrong. Please try again.';
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password }).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
};

export const eventApi = {
  list: (q?: string) =>
    api.get<EventItem[]>('/events', { params: q ? { q } : undefined }).then((r) => r.data),
  get: (id: number) => api.get<EventItem>(`/events/${id}`).then((r) => r.data),
  create: (data: EventInput) => api.post<EventItem>('/events', data).then((r) => r.data),
  update: (id: number, data: EventInput) =>
    api.put<EventItem>(`/events/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/events/${id}`).then(() => undefined),
};

export const uploadApi = {
  /** Uploads an image and returns its public URL. */
  image: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ url: string }>('/uploads', form).then((r) => r.data.url);
  },
};

export const bookingApi = {
  create: (eventId: number, bookedSeats: number) =>
    api.post<Booking>('/bookings', { eventId, bookedSeats }).then((r) => r.data),
  mine: () => api.get<Booking[]>('/bookings/my').then((r) => r.data),
  cancel: (id: number) => api.post<Booking>(`/bookings/${id}/cancel`).then((r) => r.data),
};

export const ticketApi = {
  verify: (qrCodeData: string) =>
    api.post<VerifyResult>('/tickets/verify', { qrCodeData }).then((r) => r.data),
};