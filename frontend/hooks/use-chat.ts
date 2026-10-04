import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useActiveOrgId } from './use-projects';

export interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string };
}

export function useChat() {
  const orgId = useActiveOrgId();
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef<Socket | null>(null);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);

  const { data: history, isLoading } = useQuery({
    queryKey: ['chat-history', orgId],
    queryFn: () =>
      apiClient.get(`/organizations/${orgId}/chat/messages`).then((r) => r.data as ChatMessage[]),
    enabled: !!orgId,
  });

  useEffect(() => {
    if (!orgId) return;

    const socketUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-chat', { organizationId: orgId });
    });

    socket.on('new-message', (message: ChatMessage) => {
      setLiveMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.emit('leave-chat', { organizationId: orgId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orgId]);

  const sendMessage = useCallback(
    (body: string) => {
      if (!socketRef.current || !orgId || !user) return;
      socketRef.current.emit('send-message', { organizationId: orgId, userId: user.id, body });
    },
    [orgId, user],
  );

  const allMessages = [...(history ?? []), ...liveMessages];

  return { messages: allMessages, isLoading, sendMessage };
}