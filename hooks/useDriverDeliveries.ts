import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Delivery, PaginatedResponse, LocationUpdateData, TripSummary } from '@/types/api';
import { useAuthStore } from '@/stores/AuthStore';

// Fetch role-filtered deliveries
export function useDeliveries(status?: string) {
  const token = useAuthStore((s) => s.tokens?.access);

  return useQuery<PaginatedResponse<Delivery>, Error>({
    queryKey: ['deliveries', status],
    queryFn: async () => {
      const queryParam = status ? `?status=${status}` : '';
      return apiFetch<PaginatedResponse<Delivery>>(`api/deliveries/${queryParam}`, {
        token,
      });
    },
    enabled: !!token,
  });
}

// Driver Accept Delivery (202 Accepted)
export function useAcceptDelivery() {
  const token = useAuthStore((s) => s.tokens?.access);
  const queryClient = useQueryClient();

  return useMutation<{ detail: string }, Error, number>({
    mutationFn: async (deliveryId: number) => {
      return apiFetch<{ detail: string }>(`api/deliveries/${deliveryId}/accept/`, {
        method: 'POST',
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}

// Driver Background GPS Location Update
export function useSendLocationUpdate() {
  const token = useAuthStore((s) => s.tokens?.access);

  return useMutation<{ status: string }, Error, LocationUpdateData>({
    mutationFn: async (payload) => {
      return apiFetch<{ status: string }>('api/location/update/', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });
    },
  });
}

// Driver Trip Summary
export function useDriverTripSummary(deliveryId: number) {
  const token = useAuthStore((s) => s.tokens?.access);

  return useQuery<TripSummary, Error>({
    queryKey: ['driver-trip-summary', deliveryId],
    queryFn: async () => {
      return apiFetch<TripSummary>(`api/trips/${deliveryId}/driver-summary/`, {
        token,
      });
    },
    enabled: !!token && !!deliveryId,
  });
}
