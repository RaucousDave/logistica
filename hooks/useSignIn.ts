import { AuthResponse, UserRole } from '@/hooks/types/api';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/stores/AuthStore';
import { useMutation } from '@tanstack/react-query';

export interface SignInParams {
  username?: string;
  email?: string;
  password: string;
  role: Extract<UserRole, 'client' | 'driver'>;
}

export function useSignIn() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<AuthResponse, Error, SignInParams>({
    mutationFn: async (credentials) => {
      console.log('credetials: ', credentials)
      const res = await apiFetch<AuthResponse>('api/auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      console.log(res)
      return res;

    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
    },
  });
}