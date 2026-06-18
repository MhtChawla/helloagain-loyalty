import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { ApiError, CustomerRelationship } from '../../api/types';

export function usePoints() {
  return useQuery<CustomerRelationship, ApiError>({
    queryKey: ['cr'],
    queryFn: async () => {
      const { data } = await apiClient.get<CustomerRelationship>(
        endpoints.customerRelationship()
      );
      return data;
    },
  });
}
