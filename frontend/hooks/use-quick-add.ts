import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useActiveOrgId } from './use-projects';

interface QuickAddResult {
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
}

export function useQuickAddParse() {
  const orgId = useActiveOrgId();
  return useMutation({
    mutationFn: (text: string) =>
      apiClient
        .post(`/organizations/${orgId}/ai/quick-add`, { text })
        .then((r) => r.data as QuickAddResult),
  });
}