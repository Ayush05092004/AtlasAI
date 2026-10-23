import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/users/me').then((r) => r.data as Profile),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { firstName: string; lastName: string; jobTitle: string }) =>
      apiClient.patch('/users/me', input).then((r) => r.data as Profile),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile'], profile);
      // Keep the sidebar name in sync without a reload.
      const current = useAuthStore.getState().user;
      if (current) {
        useAuthStore.setState({
          user: { ...current, firstName: profile.firstName, lastName: profile.lastName },
        });
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      apiClient.post('/users/me/password', input).then((r) => r.data),
  });
}