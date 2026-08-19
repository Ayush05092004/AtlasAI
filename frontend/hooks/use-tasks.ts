import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Task {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  assignee: { id: string; firstName: string; lastName: string } | null;
  dueDate: string | null;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Task['priority'];
}

interface MoveTaskInput {
  taskId: string;
  status: Task['status'];
  position: number;
}

function tasksPath(orgId: string, projectId: string) {
  return `/organizations/${orgId}/projects/${projectId}/tasks`;
}

export function useTasks(orgId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', orgId, projectId],
    queryFn: () => apiClient.get(tasksPath(orgId!, projectId!)).then((r) => r.data as Task[]),
    enabled: !!orgId && !!projectId,
  });
}

export function useCreateTask(orgId: string | undefined, projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      apiClient.post(tasksPath(orgId!, projectId!), input).then((r) => r.data as Task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
    },
  });
}

export function useMoveTask(orgId: string | undefined, projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status, position }: MoveTaskInput) =>
      apiClient
        .patch(`${tasksPath(orgId!, projectId!)}/${taskId}/move`, { status, position })
        .then((r) => r.data as Task),
    // Optimistic update: move the card instantly in the UI, before the
    // server confirms, so drag-and-drop feels instant rather than laggy.
    onMutate: async ({ taskId, status, position }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', orgId, projectId] });
      const previous = queryClient.getQueryData<Task[]>(['tasks', orgId, projectId]);

      queryClient.setQueryData<Task[]>(['tasks', orgId, projectId], (old) =>
        old?.map((t) => (t.id === taskId ? { ...t, status, position } : t)),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back to the previous state if the server rejects the move.
      if (context?.previous) {
        queryClient.setQueryData(['tasks', orgId, projectId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId, projectId] });
    },
  });
}