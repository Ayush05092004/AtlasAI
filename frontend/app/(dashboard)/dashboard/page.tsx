'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, FolderKanban, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useProjects } from '@/hooks/use-projects';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: projects, isLoading } = useProjects();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const activeProjects = projects?.filter((p) => p.status === 'ACTIVE').length ?? 0;
  const totalTasks = projects?.reduce((sum, p) => sum + p._count.tasks, 0) ?? 0;

  const stats = [
    {
      label: 'Total projects',
      value: isLoading ? '-' : String(projects?.length ?? 0),
      change: `${activeProjects} active`,
      icon: FolderKanban,
      accent: 'violet' as const,
    },
    {
      label: 'Total tasks',
      value: isLoading ? '-' : String(totalTasks),
      change: 'across all projects',
      icon: Clock,
      accent: 'cyan' as const,
    },
    {
      label: 'Velocity',
      value: '-',
      change: 'coming with Tasks module',
      icon: TrendingUp,
      accent: 'violet' as const,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <motion.div initial="initial" animate="animate" variants={fadeUp} transition={{ duration: 0.4 }}>
        <p className="font-mono text-xs uppercase tracking-wider text-atlas-cyan">{greeting}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
          {user?.firstName ?? 'there'}, here&apos;s what&apos;s moving.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {isLoading
            ? 'Loading your workspace...'
            : projects?.length
              ? `You have ${projects.length} project${projects.length === 1 ? '' : 's'} with ${totalTasks} task${totalTasks === 1 ? '' : 's'} total.`
              : 'Create your first project to get started.'}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-atlas-violet to-atlas-cyan px-4 py-2 text-sm font-medium text-atlas-ink transition-opacity hover:opacity-90">
            <Sparkles className="h-4 w-4" />
            Ask AtlasAI
          </button>
          
            <a href="/projects"
            className="rounded-lg border border-atlas-panel-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/[0.03]"
          >
            View projects
          </a>
        </div>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial="initial"
            animate="animate"
            variants={fadeUp}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
            className="rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <stat.icon
                className={`h-4 w-4 ${stat.accent === 'violet' ? 'text-atlas-violet' : 'text-atlas-cyan'}`}
              />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-8 rounded-xl border border-atlas-panel-border bg-atlas-panel/50"
      >
        <div className="flex items-center justify-between border-b border-atlas-panel-border px-5 py-4">
          <h2 className="font-display text-sm font-semibold text-foreground">Your projects</h2>
          <a href="/projects" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            View all <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
        {isLoading && <p className="px-5 py-6 text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && projects?.length === 0 && (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No projects yet.{' '}
            <a href="/projects" className="text-atlas-cyan hover:underline">
              Create one
            </a>
            .
          </p>
        )}
        <ul className="divide-y divide-atlas-panel-border">
          {projects?.slice(0, 5).map((project) => (
            <li key={project.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-muted-foreground">{project.key}</span>
                <span className="text-sm font-medium text-foreground">{project.name}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{project._count.tasks} tasks</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}