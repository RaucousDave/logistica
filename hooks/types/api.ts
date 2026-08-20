export type UserRole = 'client' | 'driver' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  phone_number?: string;
  is_available?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
}

export type DeliveryStatus = 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';

export interface Delivery {
  id: number;
  client: number | User;
  driver?: number | User | null;
  pickup_address: string;
  dropoff_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  status: DeliveryStatus;
  package_details?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LocationUpdateData {
  delivery_id: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

export interface LocationPoint {
  id?: number;
  delivery?: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp?: string;
}

export interface TripSummary {
  id: number;
  delivery: number;
  total_distance_km: number;
  total_duration_minutes: number;
  start_time: string;
  end_time: string;
  average_speed_kmh?: number;
}

// WebSocket Event Types
export type WebSocketEventType =
  | 'job_request'
  | 'job_accepted'
  | 'job_taken'
  | 'job_cancelled'
  | 'location_update'
  | 'delivery_confirmed';

export interface WebSocketMessage<T = any> {
  event: WebSocketEventType;
  data: T;
}
