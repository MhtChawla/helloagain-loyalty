import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { RedeemRewardResponse } from '../../api/types';

export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bountyId: string): Promise<RedeemRewardResponse> => {
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
