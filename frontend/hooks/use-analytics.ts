import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useActiveOrgId } from './use-projects';

interface ProjectProgress {
  id: string;
  name: string;
  status: string;
  totalTasks: number;
  doneTasks: number;
  completionPercent: number;
}

interface AnalyticsOverview {
  totalTasks: number;
  totalProjects: number;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  projectProgress: ProjectProgress[];
  completedTrend: { date: string; count: number }[];
}

export function useAnalytics() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['analytics', orgId],
    queryFn: () =>
      apiClient.get(`/organizations/${orgId}/analytics/overview`).then((r) => r.data as AnalyticsOverview),
    enabled: !!orgId,
  });
}