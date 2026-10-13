import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useActiveOrgId } from './use-projects';

interface Webhook {
  id: string;
  name: string;
  url: string;
  event: string;
  isActive: boolean;
  createdAt: string;
}

export function useWebhooks() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['webhooks', orgId],
    queryFn: () => apiClient.get(`/organizations/${orgId}/webhooks`).then((r) => r.data as Webhook[]),
    enabled: !!orgId,
  });
}

export function useCreateWebhook() {
  const orgId = useActiveOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; url: string; event: string }) =>
      apiClient.post(`/organizations/${orgId}/webhooks`, input).then((r) => r.data as Webhook),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks', orgId] }),
  });
}

export function useDeleteWebhook() {
  const orgId = useActiveOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) =>
      apiClient.delete(`/organizations/${orgId}/webhooks/${webhookId}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks', orgId] }),
  });
}