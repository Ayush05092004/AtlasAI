import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  color: string;
  createdAt: string;
  _count: { tasks: number };
}

interface CreateProjectInput {
  name: string;
  key: string;
  description?: string;
}

function useActiveOrgId() {
  // For now, we use the first (and only) organization every user gets automatically.
  // Once multi-org switching is built, this will come from a selected-org store instead.
  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => apiClient.get('/organizations').then((r) => r.data as { id: string }[]),
    enabled: !!useAuthStore.getState().accessToken,
  });
  return orgs?.[0]?.id;
}

export function useProjects() {
  const orgId = useActiveOrgId();

  return useQuery({
    queryKey: ['projects', orgId],
    queryFn: () =>
      apiClient.get(`/organizations/${orgId}/projects`).then((r) => r.data as Project[]),
    enabled: !!orgId,
  });
}

export function useCreateProject() {
  const orgId = useActiveOrgId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      apiClient
        .post(`/organizations/${orgId}/projects`, input)
        .then((r) => r.data as Project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
    },
  });
}