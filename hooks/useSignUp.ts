import { AuthResponse } from "@/hooks/types/api";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/AuthStore";
import { useMutation } from "@tanstack/react-query";

export interface ClientRegisterParams {
  username: string;
  email: string;
  password: string;
  phone_number?: string;
}

export interface DriverRegisterParams {
  username: string;
  email: string;
  password: string;
  phone_number?: string;
}

export function useRegisterClient() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<AuthResponse, Error, ClientRegisterParams>({
    mutationFn: async (payload) => {
      console.log("Payload to register endpoint: ", payload);
      const res = await apiFetch<AuthResponse>("api/auth/register/client/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
    },
  });
}

export function useRegisterDriver() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<AuthResponse, Error, DriverRegisterParams>({
    mutationFn: async (payload) => {
      const res = await apiFetch<AuthResponse>("api/auth/register/driver/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
    },
  });
}
