'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, MessageSquare, UserPlus, ArrowRightLeft, AtSign, Mail, X } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications';
import { playNotificationSound } from '@/lib/notification-sound';

const TYPE_ICON: Record<string, typeof Bell> = {
  TASK_ASSIGNED: UserPlus,
  TASK_COMMENTED: MessageSquare,
  TASK_STATUS_CHANGED: ArrowRightLeft,
  MENTIONED: AtSign,
  ORG_INVITE: Mail,
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const { data: notifications } = useNotifications();
  const { data: unread } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const [open, setOpen] = useState(false);
  const previousCount = useRef<number | undefined>(undefined);

  const count = unread?.count ?? 0;

  useEffect(() => {
    if (previousCount.current !== undefined && count > previousCount.current) {
      playNotificationSound();
    }
    previousCount.current = count;
  }, [count]);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={count > 0 ? { rotate: [0, -12, 10, -8, 6, 0] } : {}}
        transition={count > 0 ? { duration: 0.6, repeat: Infinity, repeatDelay: 4 } : {}}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-atlas-panel-border bg-atlas-panel/60 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-atlas-violet to-atlas-cyan px-1 text-[9px] font-bold text-atlas-ink"
            >
              {count > 9 ? '9+' : count}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-xl border border-atlas-panel-border bg-atlas-panel shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-atlas-panel-border px-4 py-3">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                <div className="flex items-center gap-3">
                  {count > 0 && (
                    <button
                      onClick={() => markAllAsRead.mutate()}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-atlas-cyan"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {!notifications || notifications.length === 0 ? (
                  <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  notifications.map((n, i) => {
                    const Icon = TYPE_ICON[n.type] ?? Bell;
                    const isUnread = !n.readAt;
                    return (
                      <motion.button
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        onClick={() => isUnread && markAsRead.mutate(n.id)}
                        className={`flex w-full items-start gap-3 border-b border-atlas-panel-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.03] ${
                          isUnread ? 'bg-atlas-violet/[0.04]' : ''
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            isUnread
                              ? 'bg-gradient-to-br from-atlas-violet to-atlas-cyan text-atlas-ink'
                              : 'bg-white/[0.05] text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs leading-snug ${isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{n.body}</p>
                          )}
                          <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                        </div>
                        {isUnread && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-atlas-cyan" />}
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}