import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string };
}

function commentsPath(orgId: string, projectId: string, taskId: string) {
  return `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments`;
}

export function useComments(
  orgId: string | undefined,
  projectId: string | undefined,
  taskId: string | undefined,
) {
  return useQuery({
    queryKey: ['comments', orgId, projectId, taskId],
    queryFn: () =>
      apiClient.get(commentsPath(orgId!, projectId!, taskId!)).then((r) => r.data as Comment[]),
    enabled: !!orgId && !!projectId && !!taskId,
  });
}

export function useAddComment(
  orgId: string | undefined,
  projectId: string | undefined,
  taskId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      apiClient.post(commentsPath(orgId!, projectId!, taskId!), { body }).then((r) => r.data as Comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', orgId, projectId, taskId] });
    },
  });
}

export function useDeleteComment(
  orgId: string | undefined,
  projectId: string | undefined,
  taskId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      apiClient.delete(`${commentsPath(orgId!, projectId!, taskId!)}/${commentId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', orgId, projectId, taskId] });
    },
  });
}