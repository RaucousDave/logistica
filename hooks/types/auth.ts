export type UserRole = "customer" | "driver";

export type VehicleType = "motorcycle" | "car" | "van";

export interface DriverDetails {
  vehicleType: VehicleType;
  plateNumber: string;
  driverLicense: string;
}

export interface PersonalDetails {
  name: string;
  email: string;
  phone: string;
}

export interface UserProfile extends PersonalDetails {
  id: string;
  role: UserRole;
  driverDetails?: DriverDetails;
}
