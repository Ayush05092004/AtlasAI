'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { CreateTaskButton } from '@/components/tasks/create-task-button';
import { Button } from '@/components/ui/button';
import { useActiveOrgId, useProject, useUpdateProject, useDeleteProject } from '@/hooks/use-projects';

const STATUS_OPTIONS = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'] as const;

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const orgId = useActiveOrgId();
  const { data: project, isLoading } = useProject(params.projectId);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!orgId || isLoading || !project) {
    return <p className="px-8 py-10 text-sm text-muted-foreground">Loading...</p>;
  }

  const handleStatusChange = (status: (typeof STATUS_OPTIONS)[number]) => {
    updateProject.mutate({ projectId: project.id, status });
  };

  const handleDelete = () => {
    deleteProject.mutate(project.id, {
      onSuccess: () => router.push('/projects'),
    });
  };

  return (
    <div className="px-8 py-10">
      <Link
        href="/projects"
        className="mb-4 flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All projects
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{project.key}</span>
            <h1 className="font-display text-xl font-semibold text-foreground">{project.name}</h1>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value as (typeof STATUS_OPTIONS)[number])}
            className="rounded-md border border-atlas-panel-border bg-atlas-panel px-3 py-1.5 text-xs text-foreground"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <CreateTaskButton orgId={orgId} projectId={project.id} />
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md border border-atlas-panel-border p-2 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
            title="Delete project"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-xs text-destructive">
            Delete &ldquo;{project.name}&rdquo; and all its tasks permanently? This can&apos;t be undone.
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteProject.isPending ? 'Deleting...' : 'Yes, delete project'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <KanbanBoard orgId={orgId} projectId={project.id} />
    </div>
  );
}