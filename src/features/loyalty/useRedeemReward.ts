import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { queryClient } from '../../lib/queryClient';
import type { ApiError, RedeemRewardResponse } from '../../api/types';

export function useRedeemReward() {
  return useMutation<RedeemRewardResponse, ApiError, string>({
    mutationFn: async (bountyId: string) => {
      const { data } = await apiClient.post<RedeemRewardResponse>(
        endpoints.redeemReward(),
        { bounty_id: bountyId }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cr'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}
