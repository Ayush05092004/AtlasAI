'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  BarChart3,
  Sparkles,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { NotificationBell } from './notification-bell';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/assistant', label: 'AI Assistant', icon: Sparkles },
  { href: '/chat', label: 'Team Chat', icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex h-screen w-60 shrink-0 flex-col border-r border-atlas-panel-border bg-atlas-panel/60"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex h-16 items-center justify-between gap-2 border-b border-atlas-panel-border px-4"
      >
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-atlas-violet to-atlas-cyan"
          >
            <span className="font-display text-xs font-bold text-atlas-ink">A</span>
          </motion.div>
          <span className="font-display text-sm font-semibold tracking-tight">AtlasAI</span>
        </div>
        <NotificationBell />
      </motion.div>

      <LayoutGroup>
        <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <motion.div
                key={href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.04 }}
              >
                <Link
                  href={href}
                  className="group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-md bg-atlas-violet/15"
                    />
                  )}
                  <motion.span whileHover={{ x: 2 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                    <Icon
                      className={`relative h-4 w-4 transition-colors ${active ? 'text-atlas-cyan' : 'group-hover:text-atlas-cyan/70'}`}
                    />
                  </motion.span>
                  <span className={`relative ${active ? 'text-foreground' : ''}`}>{label}</span>
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="relative ml-auto h-1.5 w-1.5 rounded-full bg-gradient-to-br from-atlas-violet to-atlas-cyan"
                      />
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </LayoutGroup>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="border-t border-atlas-panel-border p-3"
      >
        <Link
          href="/settings"
          className="group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.03] hover:text-foreground"
        >
          <motion.span whileHover={{ rotate: 90 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
            <Settings className="h-4 w-4" />
          </motion.span>
          Settings
        </Link>
        <motion.div
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          className="mt-2 flex items-center gap-2.5 rounded-md px-2.5 py-2"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-atlas-violet to-atlas-cyan text-xs font-semibold text-atlas-ink">
            {user?.firstName?.[0] ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email ?? ''}</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
}