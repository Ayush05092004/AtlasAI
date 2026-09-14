'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flag, Calendar, CheckSquare } from 'lucide-react';
import { useMyTasks } from '@/hooks/use-my-tasks';

const STATUS_LABEL: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const STATUS_ORDER = ['IN_PROGRESS', 'IN_REVIEW', 'TODO', 'BACKLOG', 'DONE'];

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#71717A',
  MEDIUM: '#22D3EE',
  HIGH: '#FBBF24',
  URGENT: '#F87171',
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function MyTasksPage() {
  const { data: tasks, isLoading } = useMyTasks();

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    tasks: tasks?.filter((t) => t.status === status) ?? [],
  })).filter((g) => g.tasks.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <motion.div initial="initial" animate="animate" variants={fadeUp} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">My Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything assigned to you, across every project.
        </p>
      </motion.div>

      <div className="mt-8">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

        {!isLoading && (!tasks || tasks.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-atlas-panel-border py-16 text-center">
            <CheckSquare className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">Nothing on your plate</p>
            <p className="mt-1 text-xs text-muted-foreground">Tasks assigned to you will show up here.</p>
          </div>
        )}

        {grouped.map((group, gi) => (
          <motion.div
            key={group.status}
            initial="initial"
            animate="animate"
            variants={fadeUp}
            transition={{ duration: 0.4, delay: gi * 0.08 }}
            className="mb-6"
          >
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {STATUS_LABEL[group.status]}
              <span className="ml-2 text-muted-foreground/60">{group.tasks.length}</span>
            </h2>
            <div className="space-y-2">
              {group.tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.project.id}`}
                  className="flex items-center gap-3 rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-3.5 transition-colors hover:border-atlas-violet/40"
                >
                  <Flag className="h-3.5 w-3.5 shrink-0" style={{ color: PRIORITY_COLOR[task.priority] }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono">
                        {task.project.key}-{task.number}
                      </span>
                      <span>-</span>
                      <span>{task.project.name}</span>
                    </div>
                  </div>
                  {task.dueDate && (
                    <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}