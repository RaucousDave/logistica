import { create } from "zustand";

type Role = "driver" | "customer" | "";
interface UserRole {
  role: Role;
  switchRole: (role: Role) => void;
}

export const useUserRole = create<UserRole>((set) => ({
  role: "",
  switchRole(role) {
    set((state) => ({
      role: state.role === "customer" ? "driver" : "customer",
    }));
  },
}));
