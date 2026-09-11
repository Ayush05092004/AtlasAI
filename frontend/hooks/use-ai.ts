import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useActiveOrgId } from './use-projects';

interface GeneratedTask {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export function useGenerateTasks() {
  const orgId = useActiveOrgId();
  return useMutation({
    mutationFn: (goal: string) =>
      apiClient
        .post(`/organizations/${orgId}/ai/generate-tasks`, { goal })
        .then((r) => r.data as GeneratedTask[]),
  });
}

export function useProjectSummary(projectId: string | undefined, enabled: boolean) {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['ai-summary', orgId, projectId],
    queryFn: () =>
      apiClient
        .get(`/organizations/${orgId}/ai/projects/${projectId}/summary`)
        .then((r) => r.data as string),
    enabled: !!orgId && !!projectId && enabled,
    staleTime: 5 * 60 * 1000, // AI summaries are somewhat expensive - don't refetch too eagerly
  });
}