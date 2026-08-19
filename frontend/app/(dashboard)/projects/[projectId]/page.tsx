'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { CreateTaskButton } from '@/components/tasks/create-task-button';

interface Organization {
  id: string;
}

function useFirstOrgId() {
  const { data } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => apiClient.get('/organizations').then((r) => r.data as Organization[]),
  });
  return data?.[0]?.id;
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const orgId = useFirstOrgId();

  if (!orgId) {
    return <p className="px-8 py-10 text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-foreground">Board</h1>
        <CreateTaskButton orgId={orgId} projectId={params.projectId} />
      </div>
      <KanbanBoard orgId={orgId} projectId={params.projectId} />
    </div>
  );
}