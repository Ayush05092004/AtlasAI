import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ActivityEntry {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

export function useTaskActivity(
  orgId: string | undefined,
  projectId: string | undefined,
  taskId: string | undefined,
) {
  return useQuery({
    queryKey: ['activity', orgId, projectId, taskId],
    queryFn: () =>
      apiClient
        .get(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/activity`)
        .then((r) => r.data as ActivityEntry[]),
    enabled: !!orgId && !!projectId && !!taskId,
  });
}