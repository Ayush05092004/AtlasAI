import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useActiveOrgId } from './use-projects';

export interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

export interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export function useMembers() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['members', orgId],
    queryFn: () => apiClient.get(`/organizations/${orgId}/members`).then((r) => r.data as Member[]),
    enabled: !!orgId,
  });
}

export function usePendingInvites() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['invites', orgId],
    queryFn: () => apiClient.get(`/organizations/${orgId}/invites`).then((r) => r.data as Invite[]),
    enabled: !!orgId,
  });
}

export function useCreateInvite() {
  const orgId = useActiveOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role?: string }) =>
      apiClient.post(`/organizations/${orgId}/invites`, input).then((r) => r.data as Invite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', orgId] });
    },
  });
}

export function useRevokeInvite() {
  const orgId = useActiveOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      apiClient.delete(`/organizations/${orgId}/invites/${inviteId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', orgId] });
    },
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: (token: string) =>
      apiClient.post('/organizations/accept-invite', { token }).then((r) => r.data),
  });
}