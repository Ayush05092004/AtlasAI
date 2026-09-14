import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useActiveOrgId } from './use-projects';

interface MyTask {
  id: string;
  number: number;
  title: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  project: { id: string; name: string; key: string; color: string };
}

export function useMyTasks() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['my-tasks', orgId],
    queryFn: () => apiClient.get(`/organizations/${orgId}/my-tasks`).then((r) => r.data as MyTask[]),
    enabled: !!orgId,
  });
}