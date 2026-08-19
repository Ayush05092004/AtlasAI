'use client';

import { useState } from 'react';
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
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { useTasks, useMoveTask, type Task } from '@/hooks/use-tasks';

const COLUMNS: { status: Task['status']; title: string; accentColor: string }[] = [
  { status: 'BACKLOG', title: 'Backlog', accentColor: '#71717A' },
  { status: 'TODO', title: 'To Do', accentColor: '#8B5CF6' },
  { status: 'IN_PROGRESS', title: 'In Progress', accentColor: '#22D3EE' },
  { status: 'IN_REVIEW', title: 'In Review', accentColor: '#FBBF24' },
  { status: 'DONE', title: 'Done', accentColor: '#4ADE80' },
];

interface KanbanBoardProps {
  orgId: string;
  projectId: string;
}

export function KanbanBoard({ orgId, projectId }: KanbanBoardProps) {
  const { data: tasks, isLoading } = useTasks(orgId, projectId);
  const moveTask = useMoveTask(orgId, projectId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // avoids accidental drags on simple clicks
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks?.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !tasks) return;

    const activeTaskData = tasks.find((t) => t.id === active.id);
    if (!activeTaskData) return;

    // `over.id` is either a column status (dropped on empty space) or
    // another task's id (dropped directly on a card) - resolve to a status either way.
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
      return; // dropped back in the same spot, nothing to do
    }

    moveTask.mutate({
      taskId: activeTaskData.id,
      status: targetStatus,
      position: Math.max(targetPosition, 0),
    });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading tasks...</p>;
  }

  return (
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
          />
        ))}
      </div>

      <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}