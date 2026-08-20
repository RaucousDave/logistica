import { VehicleType } from "./auth";

export type OrderStatus =
  | "draft"
  | "searching"
  | "driver_assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type PackageCategory = "document" | "small_box" | "medium_box" | "heavy_cargo";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
}

export interface PackageDetails {
  category: PackageCategory;
  title: string;
  weightKg?: number;
  instructions?: string;
}

export interface DeliveryOrder {
  id: string;
  senderId: string;
  senderName: string;
  senderPhone: string;
  pickupLocation: LocationCoordinates;
  dropoffLocation: LocationCoordinates;
  packageDetails: PackageDetails;
  vehicleType: VehicleType;
  estimatedPrice: number;
  status: OrderStatus;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  vehiclePlate?: string;
  etaMinutes?: number;
  createdAt: string;
}
