'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTask } from '@/hooks/use-tasks';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});
type CreateTaskValues = z.infer<typeof createTaskSchema>;

interface CreateTaskButtonProps {
  orgId: string;
  projectId: string;
}

export function CreateTaskButton({ orgId, projectId }: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask(orgId, projectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const onSubmit = (values: CreateTaskValues) => {
    createTask.mutate(values, {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
    });
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        New task
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-atlas-panel-border bg-atlas-panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">New task</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="What needs to be done?" {...register('title')} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description (optional)</Label>
                <Input id="description" placeholder="Add more detail..." {...register('description')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-3 py-2 text-sm text-foreground"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {createTask.isError && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  Couldn&apos;t create the task. Please try again.
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={createTask.isPending}
                  className="bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90"
                >
                  {createTask.isPending ? 'Creating...' : 'Create task'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}