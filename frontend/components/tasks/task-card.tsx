'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Flag, Calendar } from 'lucide-react';
import type { Task } from '@/hooks/use-tasks';

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  LOW: '#71717A',
  MEDIUM: '#22D3EE',
  HIGH: '#FBBF24',
  URGENT: '#F87171',
};

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab rounded-lg border border-atlas-panel-border bg-atlas-panel px-3 py-2.5 active:cursor-grabbing"
    >
      <p className="font-mono text-[10px] text-muted-foreground">#{task.number}</p>
      <p className="mt-1 text-sm font-medium leading-snug text-foreground">{task.title}</p>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Flag className="h-3 w-3" style={{ color: PRIORITY_COLOR[task.priority] }} />
          <span className="text-[10px] text-muted-foreground">{task.priority}</span>
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        {task.assignee && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-atlas-violet/50 to-atlas-cyan/50 text-[9px] font-semibold text-foreground">
            {task.assignee.firstName[0]}
          </div>
        )}
      </div>
    </div>
  );
}