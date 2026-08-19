'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  BarChart3,
  Sparkles,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
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
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-atlas-panel-border bg-atlas-panel/60">
      <div className="flex h-16 items-center gap-2 border-b border-atlas-panel-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-atlas-violet to-atlas-cyan">
          <span className="font-display text-xs font-bold text-atlas-ink">A</span>
        </div>
        <span className="font-display text-sm font-semibold tracking-tight">AtlasAI</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                active
                  ? 'bg-atlas-violet/15 text-foreground'
                  : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-atlas-cyan' : ''}`} />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gradient-to-br from-atlas-violet to-atlas-cyan" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-atlas-panel-border p-3">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.03] hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-2 flex items-center gap-2.5 rounded-md px-2.5 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-atlas-violet to-atlas-cyan text-xs font-semibold text-atlas-ink">
            {user?.firstName?.[0] ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email ?? ''}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}