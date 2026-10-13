import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useActiveOrgId } from './use-projects';

export interface SearchFilters {
  query: string;
  assigneeId: string;
  priority: string;
  status: string;
  dueBefore: string;
  dueAfter: string;
}

interface SearchTask {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; firstName: string; lastName: string } | null;
  project: { id: string; name: string; key: string };
}

interface SearchResults {
  projects: { id: string; name: string; key: string; status: string }[];
  tasks: SearchTask[];
}

export function useAdvancedSearch(filters: SearchFilters) {
  const orgId = useActiveOrgId();
  const hasAnyFilter = Object.values(filters).some((v) => v.trim().length > 0);

  return useQuery({
    queryKey: ['advanced-search', orgId, filters],
    queryFn: () =>
      apiClient
        .get(`/organizations/${orgId}/search`, {
          params: {
            q: filters.query,
            assigneeId: filters.assigneeId || undefined,
            priority: filters.priority || undefined,
            status: filters.status || undefined,
            dueBefore: filters.dueBefore || undefined,
            dueAfter: filters.dueAfter || undefined,
          },
        })
        .then((r) => r.data as SearchResults),
    enabled: !!orgId && hasAnyFilter,
  });
}

export function useAssignableUsers() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['assignable-users', orgId],
    queryFn: () =>
      apiClient
        .get(`/organizations/${orgId}/search/assignable-users`)
        .then((r) => r.data as { id: string; firstName: string; lastName: string }[]),
    enabled: !!orgId,
  });
}