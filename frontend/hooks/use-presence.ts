import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

interface Viewer {
  userId: string;
  firstName: string;
  lastName: string;
}

export function usePresence(projectId: string | undefined) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!projectId || !user) return;

    // Connect to the same backend host as our REST API, just without the /api path.
    const socketUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    const viewerInfo = { userId: user.id, firstName: user.firstName, lastName: user.lastName };

    socket.on('connect', () => {
      socket.emit('join-project', { projectId, user: viewerInfo });
    });

    socket.on('viewers-updated', (updatedViewers: Viewer[]) => {
      setViewers(updatedViewers);
    });

    return () => {
      socket.emit('leave-project', { projectId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, user]);

  // Exclude yourself from the displayed list - you don't need to see your own avatar.
  const otherViewers = viewers.filter((v) => v.userId !== user?.id);

  return { viewers: otherViewers };
}