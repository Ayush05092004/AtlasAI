import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useActiveOrgId } from './use-projects';

export interface AgentTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentAction {
  tool: string;
  summary: string;
  ok: boolean;
  mutated: boolean;
}

export interface AgentReply {
  reply: string;
  actions: AgentAction[];
}

// Everything the AI can change shows up in these caches.
const REFRESH_KEYS = [
  'tasks',
  'task',
  'projects',
  'project',
  'my-tasks',
  'analytics',
  'activity',
  'comments',
  'search',
  'advanced-search',
  'ai-summary',
  'notifications',
  'notifications-unread-count',
];

export function useAgentChat() {
  const orgId = useActiveOrgId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ message, history }: { message: string; history: AgentTurn[] }) =>
      apiClient.post(`/organizations/${orgId}/ai/chat`, { message, history }).then((r) => r.data as AgentReply),
    onSuccess: (data) => {
      if (data.actions.some((action) => action.mutated)) {
        for (const key of REFRESH_KEYS) {
          void queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
    },
  });
}