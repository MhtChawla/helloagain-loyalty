import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../features/auth/authStore';

export const apiClient = axios.create({
  baseURL: 'https://api.demo.helloagain.at',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const message =
      (typeof data?.detail === 'string' ? data.detail : undefined) ??
      (typeof data?.message === 'string' ? data.message : undefined) ??
      error.message ??
      'Unknown error';

    if (status === 401) {
      useAuthStore.getState().clearAuth();
    }

    return Promise.reject({ status, message });
  }
);
