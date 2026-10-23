import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useActiveOrgId } from './use-projects';

export interface CalendarTask {
  id: string;
  number: number;
  title: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  assignee: { id: string; firstName: string; lastName: string } | null;
  project: { id: string; name: string; key: string };
}

export function useCalendarTasks(from: string, to: string) {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['calendar', orgId, from, to],
    queryFn: () =>
      apiClient
        .get(`/organizations/${orgId}/search/calendar`, { params: { from, to } })
        .then((r) => r.data as CalendarTask[]),
    enabled: !!orgId,
  });
}