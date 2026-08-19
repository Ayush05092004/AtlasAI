'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '@/hooks/use-tasks';
import { TaskCard } from './task-card';

interface KanbanColumnProps {
  status: Task['status'];
  title: string;
  accentColor: string;
  tasks: Task[];
}

export function KanbanColumn({ status, title, accentColor, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <span className="ml-auto rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors ${
          isOver ? 'border-atlas-violet/50 bg-atlas-violet/[0.04]' : 'border-atlas-panel-border bg-atlas-panel/30'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-atlas-panel-border/50 py-8 text-center text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}