import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { ApiError, Profile } from '../../api/types';

export function useProfile() {
  return useQuery<Profile, ApiError>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<Profile>(endpoints.profile());
      return data;
    },
  });
}
