import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { ApiError, Bounty } from '../../api/types';

export function useRewards() {
  return useQuery<Bounty[], ApiError>({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data } = await apiClient.get<Bounty[]>(endpoints.bounties());
      return data;
    },
  });
}
