import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Delivery, PaginatedResponse, LocationPoint, TripSummary } from '@/types/api';
import { useAuthStore } from '@/stores/AuthStore';

// Fetch Client's Deliveries
export function useClientDeliveries(status?: string) {
  const token = useAuthStore((s) => s.tokens?.access);

  return useQuery<PaginatedResponse<Delivery>, Error>({
    queryKey: ['client-deliveries', status],
    queryFn: async () => {
      const queryParam = status ? `?status=${status}` : '';
      return apiFetch<PaginatedResponse<Delivery>>(`api/deliveries/${queryParam}`, {
        token,
      });
    },
    enabled: !!token,
  });
}

// Fetch Latest Location for a Delivery
export function useLatestLocation(deliveryId: number) {
  const token = useAuthStore((s) => s.tokens?.access);

  return useQuery<LocationPoint, Error>({
    queryKey: ['latest-location', deliveryId],
    queryFn: async () => {
      return apiFetch<LocationPoint>(`api/location/${deliveryId}/latest/`, {
        token,
      });
    },
    enabled: !!token && !!deliveryId,
    refetchInterval: 10000, // Poll fallback every 10s if WebSocket drops
  });
}

// Confirm Delivery Received (in_transit -> delivered)
export function useConfirmDelivery() {
  const token = useAuthStore((s) => s.tokens?.access);
  const queryClient = useQueryClient();

  return useMutation<Delivery, Error, number>({
    mutationFn: async (deliveryId: number) => {
      return apiFetch<Delivery>(`api/deliveries/${deliveryId}/confirm/`, {
        method: 'POST',
        token,
      });
    },
    onSuccess: (_, deliveryId) => {
      queryClient.invalidateQueries({ queryKey: ['client-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['latest-location', deliveryId] });
    },
  });
}

// Client Trip Summary
export function useClientTripSummary(deliveryId: number) {
  const token = useAuthStore((s) => s.tokens?.access);

  return useQuery<TripSummary, Error>({
    queryKey: ['client-trip-summary', deliveryId],
    queryFn: async () => {
      return apiFetch<TripSummary>(`api/trips/${deliveryId}/summary/`, {
        token,
      });
    },
    enabled: !!token && !!deliveryId,
  });
}
