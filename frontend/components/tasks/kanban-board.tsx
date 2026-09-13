'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Keyboard } from 'lucide-react';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { TaskDetailModal } from './task-detail-modal';
import { useTasks, useMoveTask, type Task } from '@/hooks/use-tasks';

const COLUMNS: { status: Task['status']; title: string; accentColor: string }[] = [
  { status: 'BACKLOG', title: 'Backlog', accentColor: '#71717A' },
  { status: 'TODO', title: 'To Do', accentColor: '#8B5CF6' },
  { status: 'IN_PROGRESS', title: 'In Progress', accentColor: '#22D3EE' },
  { status: 'IN_REVIEW', title: 'In Review', accentColor: '#FBBF24' },
  { status: 'DONE', title: 'Done', accentColor: '#4ADE80' },
];

// Maps number keys 1-5 to each column, in the same order as COLUMNS.
const STATUS_BY_KEY: Record<string, Task['status']> = {
  '1': 'BACKLOG',
  '2': 'TODO',
  '3': 'IN_PROGRESS',
  '4': 'IN_REVIEW',
  '5': 'DONE',
};

interface KanbanBoardProps {
  orgId: string;
  projectId: string;
}

export function KanbanBoard({ orgId, projectId }: KanbanBoardProps) {
  const { data: tasks, isLoading } = useTasks(orgId, projectId);
  const moveTask = useMoveTask(orgId, projectId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [dragMoved, setDragMoved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setDragMoved(false);
    const task = tasks?.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !tasks) return;

    const activeTaskData = tasks.find((t) => t.id === active.id);
    if (!activeTaskData) return;

    const overIsColumn = COLUMNS.some((c) => c.status === over.id);
    const targetStatus = overIsColumn
      ? (over.id as Task['status'])
      : tasks.find((t) => t.id === over.id)?.status;

    if (!targetStatus) return;

    const columnTasks = tasks.filter((t) => t.status === targetStatus && t.id !== active.id);
    const targetPosition = overIsColumn
      ? columnTasks.length
      : columnTasks.findIndex((t) => t.id === over.id);

    if (targetStatus === activeTaskData.status && targetPosition === activeTaskData.position) {
      return;
    }

    setDragMoved(true);
    moveTask.mutate({
      taskId: activeTaskData.id,
      status: targetStatus,
      position: Math.max(targetPosition, 0),
    });
  }

  function handleCardClick(taskId: string) {
    if (!dragMoved) {
      setHighlightedTaskId(taskId);
      setSelectedTaskId(taskId);
    }
    setDragMoved(false);
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't hijack keys while typing in a form field, or while a modal is already open.
      const target = e.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (isTyping || selectedTaskId || !highlightedTaskId || !tasks) return;

      const highlightedTask = tasks.find((t) => t.id === highlightedTaskId);
      if (!highlightedTask) return;

      if (STATUS_BY_KEY[e.key]) {
        const newStatus = STATUS_BY_KEY[e.key];
        const columnTasks = tasks.filter((t) => t.status === newStatus);
        moveTask.mutate({ taskId: highlightedTaskId, status: newStatus, position: columnTasks.length });
      } else if (e.key === 'Enter') {
        setSelectedTaskId(highlightedTaskId);
      }
    },
    [highlightedTaskId, selectedTaskId, tasks, moveTask],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading tasks...</p>;
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Keyboard className="h-3 w-3" />
        Click a card, then press{' '}
        <kbd className="rounded border border-atlas-panel-border bg-atlas-panel px-1 font-mono">1-5</kbd>
        to move columns, <kbd className="rounded border border-atlas-panel-border bg-atlas-panel px-1 font-mono">Enter</kbd>{' '}
        to open
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              accentColor={col.accentColor}
              tasks={(tasks ?? []).filter((t) => t.status === col.status)}
              onCardClick={handleCardClick}
              highlightedTaskId={highlightedTaskId}
            />
          ))}
        </div>

        <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
      </DndContext>

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