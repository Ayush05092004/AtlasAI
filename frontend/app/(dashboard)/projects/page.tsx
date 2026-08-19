'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProjects, useCreateProject } from '@/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  key: z
    .string()
    .min(2, 'Key must be 2-6 characters')
    .max(6)
    .regex(/^[A-Z0-9]+$/, 'Use uppercase letters/numbers only'),
  description: z.string().max(500).optional(),
});
type CreateProjectValues = z.infer<typeof createProjectSchema>;

const STATUS_COLOR: Record<string, string> = {
  PLANNING: '#71717A',
  ACTIVE: '#22D3EE',
  ON_HOLD: '#FBBF24',
  COMPLETED: '#8B5CF6',
  ARCHIVED: '#3F3F46',
};

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectValues>({ resolver: zodResolver(createProjectSchema) });

  const onSubmit = (values: CreateProjectValues) => {
    createProject.mutate(values, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything your team is building, in one place.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 overflow-hidden rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-5"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" placeholder="Website Redesign" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="key">Key</Label>
              <Input id="key" placeholder="WEB" className="uppercase" {...register('key')} />
              {errors.key && <p className="text-xs text-destructive">{errors.key.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" placeholder="What's this project about?" {...register('description')} />
          </div>
          {createProject.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Couldn&apos;t create the project. That key may already be in use.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createProject.isPending}
              className="bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90"
            >
              {createProject.isPending ? 'Creating...' : 'Create project'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </motion.form>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading projects...</p>}

        {!isLoading && projects?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-atlas-panel-border py-16 text-center">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No projects yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create your first one to get started.</p>
          </div>
        )}

        {projects?.map((project, i) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="group cursor-pointer rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-5 transition-colors hover:border-atlas-violet/40"
            >
              <div className="flex items-center justify-between">
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    color: STATUS_COLOR[project.status],
                    backgroundColor: `${STATUS_COLOR[project.status]}1A`,
                  }}
                >
                  {project.status.replace('_', ' ')}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-foreground">{project.name}</h3>
              {project.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-mono">{project.key}</span>
                <span>{project._count.tasks} tasks</span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}