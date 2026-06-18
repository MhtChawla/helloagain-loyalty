import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { useAuthStore } from './authStore';
import type { LoginResponse } from '../../api/types';

interface LoginCredentials {
  email: string;
  password: string;
}

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const { data } = await apiClient.post<LoginResponse>(
        endpoints.login(),
        credentials
      );

      if (!data.token) {
        throw { status: 0, message: 'Login response missing token' };
      }

      return data;
    },
    onSuccess: async (data) => {
      await setToken(data.token);
    },
  });
}
