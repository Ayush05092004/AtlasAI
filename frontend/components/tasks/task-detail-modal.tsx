'use client';

import { useState } from 'react';
import { X, Trash2, Flag, Calendar } from 'lucide-react';
import { useTask, useUpdateTask, useDeleteTask, type Task } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_OPTIONS: Task['status'][] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITY_OPTIONS: Task['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_LABEL: Record<Task['status'], string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

interface TaskDetailModalProps {
  orgId: string;
  projectId: string;
  taskId: string;
  onClose: () => void;
}

// Split into an outer wrapper (handles loading) and an inner form (only
// mounted once the task data exists) - this avoids needing an effect to
// sync fetched data into local state; the form simply initializes its
// state from props on first render.
export function TaskDetailModal({ orgId, projectId, taskId, onClose }: TaskDetailModalProps) {
  const { data: task, isLoading } = useTask(orgId, projectId, taskId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-atlas-panel-border bg-atlas-panel p-6">
        {isLoading || !task ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <TaskDetailForm
            key={task.id}
            orgId={orgId}
            projectId={projectId}
            task={task}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

interface TaskDetailFormProps {
  orgId: string;
  projectId: string;
  task: Task;
  onClose: () => void;
}

function TaskDetailForm({ orgId, projectId, task, onClose }: TaskDetailFormProps) {
  const updateTask = useUpdateTask(orgId, projectId);
  const deleteTask = useDeleteTask(orgId, projectId);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [status, setStatus] = useState<Task['status']>(task.status);
  const [priority, setPriority] = useState<Task['priority']>(task.priority);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    updateTask.mutate({ taskId: task.id, title, description, status, priority }, { onSuccess: onClose });
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id, { onSuccess: onClose });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">#{task.number}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-title">Title</Label>
          <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-description">Description</Label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more detail..."
            rows={4}
            className="w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-status">Status</Label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Task['status'])}
              className="w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-3 py-2 text-sm text-foreground"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-priority">Priority</Label>
            <select
              id="edit-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
              className="w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-3 py-2 text-sm text-foreground"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-atlas-panel-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Flag className="h-3 w-3" />
            {task.assignee ? `Assigned to ${task.assignee.firstName}` : 'Unassigned'}
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {confirmDelete ? (
        <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-xs text-destructive">Delete this task permanently? This can&apos;t be undone.</p>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleteTask.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteTask.isPending ? 'Deleting...' : 'Yes, delete'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete task
          </button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={updateTask.isPending}
              className="bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90"
            >
              {updateTask.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}