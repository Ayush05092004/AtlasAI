import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useActiveOrgId } from './use-projects';

interface SearchProject {
  id: string;
  name: string;
  key: string;
  status: string;
}

interface SearchTask {
  id: string;
  number: number;
  title: string;
  status: string;
  project: { id: string; name: string; key: string };
}

interface SearchResults {
  projects: SearchProject[];
  tasks: SearchTask[];
}

export function useSearch(query: string) {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['search', orgId, query],
    queryFn: () =>
      apiClient
        .get(`/organizations/${orgId}/search`, { params: { q: query } })
        .then((r) => r.data as SearchResults),
    enabled: !!orgId && query.trim().length >= 2,
  });
}