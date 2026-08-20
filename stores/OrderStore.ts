import { create } from "zustand";
import { DeliveryOrder } from "@/types/order";
import { MOCK_ACTIVE_ORDER, MOCK_AVAILABLE_JOBS } from "@/constants/mockData";

interface OrderStore {
  activeOrder: DeliveryOrder | null;
  availableJobs: DeliveryOrder[];
  isDriverOnline: boolean;
  
  // Actions
  setActiveOrder: (order: DeliveryOrder | null) => void;
  toggleDriverOnline: () => void;
  acceptJob: (orderId: string) => void;
  createOrder: (order: Partial<DeliveryOrder>) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  activeOrder: MOCK_ACTIVE_ORDER,
  availableJobs: MOCK_AVAILABLE_JOBS,
  isDriverOnline: true,

  setActiveOrder: (order) => set({ activeOrder: order }),

  toggleDriverOnline: () =>
    set((state) => ({ isDriverOnline: !state.isDriverOnline })),

  acceptJob: (orderId) =>
    set((state) => {
      const accepted = state.availableJobs.find((j) => j.id === orderId);
      if (!accepted) return state;

      return {
        availableJobs: state.availableJobs.filter((j) => j.id !== orderId),
        activeOrder: {
          ...accepted,
          status: "driver_assigned",
          driverName: "Alex Rivera (You)",
          vehiclePlate: "KXZ-8891",
        },
      };
    }),

  createOrder: (newOrderData) =>
    set((state) => {
      const newOrder: DeliveryOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        senderId: "CUST-001",
        senderName: "User",
        senderPhone: "+1 (555) 000-0000",
        pickupLocation: newOrderData.pickupLocation || {
          latitude: 37.7749,
          longitude: -122.4194,
          address: "Pickup Address",
        },
        dropoffLocation: newOrderData.dropoffLocation || {
          latitude: 37.7833,
          longitude: -122.4167,
          address: "Dropoff Address",
        },
        packageDetails: newOrderData.packageDetails || {
          category: "small_box",
          title: "Package",
        },
        vehicleType: newOrderData.vehicleType || "motorcycle",
        estimatedPrice: newOrderData.estimatedPrice || 15.0,
        status: "searching",
        createdAt: new Date().toISOString(),
      };
      return { activeOrder: newOrder };
    }),
}));
