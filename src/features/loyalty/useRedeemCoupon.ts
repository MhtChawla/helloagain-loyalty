import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { queryClient } from '../../lib/queryClient';
import type { ApiError, CustomerRelationship, RedeemResponse } from '../../api/types';

export function useRedeemCoupon() {
  return useMutation<RedeemResponse, ApiError, string>({
    mutationFn: async (code: string) => {
      const { data } = await apiClient.post<RedeemResponse>(
        endpoints.redeemCoupon(),
        { code }
      );
      if (
        !data.success ||
        !Number.isFinite(data.points) ||
        !Number.isFinite(data.cr_points)
      ) {
        throw { status: 422, message: 'Invalid coupon code' } as ApiError;
      }
      return data;
    },
    onSuccess: (data) => {
      // Write the server-confirmed balance immediately — no guess, no rollback needed
      queryClient.setQueryData<CustomerRelationship>(['cr'], (old: CustomerRelationship | undefined) =>
        old ? { ...old, points: data.cr_points } : old
      );
      // Invalidate to fully reconcile (re-flips is_redeemable on rewards)
      queryClient.invalidateQueries({ queryKey: ['cr'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}
