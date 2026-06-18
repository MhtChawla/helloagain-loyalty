import axios from 'axios';

// Mock authStore before importing client so interceptors pick up the mock
jest.mock('../features/auth/authStore');
import { useAuthStore } from '../features/auth/authStore';

// Import client to register interceptors
import { apiClient } from './client';

const mockGetState = useAuthStore.getState as jest.Mock;

// Pull interceptors off the live instance
const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled as (
  config: any,
) => any;
const responseErrorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected as (
  error: any,
) => Promise<never>;

describe('apiClient interceptors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('request interceptor', () => {
    it('injects Authorization header when a token is present', () => {
      mockGetState.mockReturnValue({ token: 'abc123', clearAuth: jest.fn() });

      const config = requestInterceptor({ headers: {} });

      expect(config.headers.Authorization).toBe('Token abc123');
    });

    it('omits Authorization header when there is no token', () => {
      mockGetState.mockReturnValue({ token: null, clearAuth: jest.fn() });

      const config = requestInterceptor({ headers: {} });

      expect(config.headers.Authorization).toBeUndefined();
    });
  });

  describe('response error interceptor', () => {
    it('normalizes the error to { status, message } ApiError shape', async () => {
      mockGetState.mockReturnValue({ token: null, clearAuth: jest.fn() });

      const axiosError = {
        response: { status: 400, data: { detail: 'Bad input' } },
        message: 'Request failed',
        isAxiosError: true,
      };

      await expect(responseErrorInterceptor(axiosError)).rejects.toEqual({
        status: 400,
        message: 'Bad input',
      });
    });

    it('calls clearAuth on 401 to tear down the session', async () => {
      const clearAuth = jest.fn();
      mockGetState.mockReturnValue({ token: 'stale', clearAuth });

      const axiosError = {
        response: { status: 401, data: {} },
        message: 'Unauthorized',
        isAxiosError: true,
      };

      await expect(responseErrorInterceptor(axiosError)).rejects.toMatchObject({ status: 401 });
      expect(clearAuth).toHaveBeenCalledTimes(1);
    });

    it('does not call clearAuth on non-401 errors', async () => {
      const clearAuth = jest.fn();
      mockGetState.mockReturnValue({ token: 'valid', clearAuth });

      const axiosError = {
        response: { status: 400, data: {} },
        message: 'Bad Request',
        isAxiosError: true,
      };

      await expect(responseErrorInterceptor(axiosError)).rejects.toMatchObject({ status: 400 });
      expect(clearAuth).not.toHaveBeenCalled();
    });
  });
});
