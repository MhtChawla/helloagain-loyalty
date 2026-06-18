import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { Profile } from '../../api/types';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<Profile>(endpoints.profile());
      return data;
    },
  });
}
