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

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string;
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

export function useTask(
  orgId: string | undefined,
  projectId: string | undefined,
  taskId: string | undefined,
) {
  return useQuery({
    queryKey: ['task', orgId, projectId, taskId],
    queryFn: () =>
      apiClient.get(`${tasksPath(orgId!, projectId!)}/${taskId}`).then((r) => r.data as Task),
    enabled: !!orgId && !!projectId && !!taskId,
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

export function useUpdateTask(orgId: string | undefined, projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, ...input }: UpdateTaskInput & { taskId: string }) =>
      apiClient
        .patch(`${tasksPath(orgId!, projectId!)}/${taskId}`, input)
        .then((r) => r.data as Task),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['task', orgId, projectId, variables.taskId] });
    },
  });
}

export function useDeleteTask(orgId: string | undefined, projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      apiClient.delete(`${tasksPath(orgId!, projectId!)}/${taskId}`).then((r) => r.data),
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
    onMutate: async ({ taskId, status, position }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', orgId, projectId] });
      const previous = queryClient.getQueryData<Task[]>(['tasks', orgId, projectId]);

      queryClient.setQueryData<Task[]>(['tasks', orgId, projectId], (old) =>
        old?.map((t) => (t.id === taskId ? { ...t, status, position } : t)),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tasks', orgId, projectId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId, projectId] });
    },
  });
}