'use client';

import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useTasks, type Task } from '@/hooks/use-tasks';
import { TaskDetailModal } from './task-detail-modal';

const STATUS_ORDER: Task['status'][] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITY_ORDER: Task['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_LABEL: Record<Task['status'], string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const STATUS_COLOR: Record<Task['status'], string> = {
  BACKLOG: '#71717A',
  TODO: '#8B5CF6',
  IN_PROGRESS: '#22D3EE',
  IN_REVIEW: '#FBBF24',
  DONE: '#4ADE80',
};

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  LOW: '#71717A',
  MEDIUM: '#22D3EE',
  HIGH: '#FBBF24',
  URGENT: '#F87171',
};

type SortKey = 'number' | 'title' | 'status' | 'priority' | 'dueDate';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'number', label: 'Key' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'dueDate', label: 'Due' },
];

function isOverdue(task: Task) {
  return !!task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date();
}

function compareTasks(a: Task, b: Task, key: SortKey): number {
  switch (key) {
    case 'number':
      return a.number - b.number;
    case 'title':
      return a.title.localeCompare(b.title);
    case 'status':
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    case 'priority':
      return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    case 'dueDate':
      // Tasks without a due date always sort last.
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  }
}

interface TaskTableProps {
  orgId: string;
  projectId: string;
  projectKey: string;
}

export function TaskTable({ orgId, projectId, projectKey }: TaskTableProps) {
  const { data: tasks, isLoading } = useTasks(orgId, projectId);
  const [sortKey, setSortKey] = useState<SortKey>('number');
  const [ascending, setAscending] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setAscending((v) => !v);
    } else {
      setSortKey(key);
      setAscending(true);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading tasks...</p>;

  const sorted = [...(tasks ?? [])].sort((a, b) => {
    const result = compareTasks(a, b, sortKey);
    return ascending ? result : -result;
  });

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-atlas-panel-border bg-atlas-panel/30">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-atlas-panel-border text-[11px] uppercase tracking-wider text-muted-foreground">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-foreground">
                    {col.label}
                    <ArrowUpDown className={`h-3 w-3 ${sortKey === col.key ? 'text-atlas-cyan' : 'opacity-40'}`} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-xs text-muted-foreground">
                  No tasks in this project yet.
                </td>
              </tr>
            )}
            {sorted.map((task) => (
              <tr
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="cursor-pointer border-b border-atlas-panel-border/60 last:border-0 hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {projectKey}-{task.number}
                </td>
                <td className="max-w-xs truncate px-4 py-3 font-medium text-foreground">{task.title}</td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                    style={{ color: STATUS_COLOR[task.status], backgroundColor: `${STATUS_COLOR[task.status]}1A` }}
                  >
                    {STATUS_LABEL[task.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span style={{ color: PRIORITY_COLOR[task.priority] }}>{task.priority}</span>
                </td>
                <td className={`px-4 py-3 text-xs ${isOverdue(task) ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '-'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          orgId={orgId}
          projectId={projectId}
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </>
  );
}