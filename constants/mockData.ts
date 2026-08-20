import { DeliveryOrder } from "@/types/order";

export const MOCK_ACTIVE_ORDER: DeliveryOrder = {
  id: "ORD-9482",
  senderId: "CUST-001",
  senderName: "Sarah Jenkins",
  senderPhone: "+1 (555) 234-5678",
  pickupLocation: {
    latitude: 37.7749,
    longitude: -122.4194,
    address: "742 Evergreen Terrace, Springfield",
  },
  dropoffLocation: {
    latitude: 37.7833,
    longitude: -122.4167,
    address: "100 Pine Street, Suite 400, San Francisco",
  },
  packageDetails: {
    category: "small_box",
    title: "Care Package & Electronics",
    weightKg: 2.5,
    instructions: "Please handle fragile electronics carefully.",
  },
  vehicleType: "motorcycle",
  estimatedPrice: 18.5,
  status: "in_transit",
  driverId: "DRV-102",
  driverName: "Alex Rivera",
  driverPhone: "+1 (555) 876-5432",
  driverRating: 4.9,
  vehiclePlate: "KXZ-8891",
  etaMinutes: 12,
  createdAt: "2026-07-31T09:30:00Z",
};

export const MOCK_AVAILABLE_JOBS: DeliveryOrder[] = [
  {
    id: "ORD-1002",
    senderId: "CUST-004",
    senderName: "David Miller",
    senderPhone: "+1 (555) 345-6789",
    pickupLocation: {
      latitude: 37.775,
      longitude: -122.418,
      address: "123 Market St, San Francisco",
    },
    dropoffLocation: {
      latitude: 37.785,
      longitude: -122.408,
      address: "456 Mission St, San Francisco",
    },
    packageDetails: {
      category: "document",
      title: "Legal Contracts",
      weightKg: 0.5,
    },
    vehicleType: "motorcycle",
    estimatedPrice: 14.0,
    status: "searching",
    createdAt: "2026-07-31T09:40:00Z",
  },
  {
    id: "ORD-1003",
    senderId: "CUST-009",
    senderName: "Elena Rostova",
    senderPhone: "+1 (555) 987-1234",
    pickupLocation: {
      latitude: 37.765,
      longitude: -122.428,
      address: "890 Valencia St, San Francisco",
    },
    dropoffLocation: {
      latitude: 37.795,
      longitude: -122.398,
      address: "1 Embarcadero Center, San Francisco",
    },
    packageDetails: {
      category: "medium_box",
      title: "Handmade Ceramics",
      weightKg: 5.0,
    },
    vehicleType: "car",
    estimatedPrice: 28.5,
    status: "searching",
    createdAt: "2026-07-31T09:42:00Z",
  },
];
