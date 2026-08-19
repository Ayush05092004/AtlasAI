import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginFormValues, RegisterFormValues } from '@/lib/schemas';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (values: LoginFormValues) =>
      apiClient.post<AuthResponse>('/auth/login', values).then((r) => r.data),
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      router.push('/dashboard');
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (values: RegisterFormValues) =>
      apiClient.post<AuthResponse>('/auth/register', values).then((r) => r.data),
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      router.push('/dashboard');
    },
  });
}