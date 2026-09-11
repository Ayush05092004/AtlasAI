'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Plus, Check, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGenerateTasks } from '@/hooks/use-ai';
import { useProjects } from '@/hooks/use-projects';
import { useCreateTask } from '@/hooks/use-tasks';
import { useActiveOrgId } from '@/hooks/use-projects';

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#71717A',
  MEDIUM: '#22D3EE',
  HIGH: '#FBBF24',
  URGENT: '#F87171',
};

interface GeneratedTask {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export default function AssistantPage() {
  const orgId = useActiveOrgId();
  const { data: projects } = useProjects();
  const [goal, setGoal] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());
  const generateTasks = useGenerateTasks();
  const createTask = useCreateTask(orgId, selectedProjectId);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    generateTasks.mutate(goal, {
      onSuccess: (result) => {
        setTasks(result);
        setAddedTitles(new Set());
      },
    });
  };

  const handleAddTask = (task: GeneratedTask) => {
    if (!selectedProjectId) return;
    createTask.mutate(
      { title: task.title, description: task.description, priority: task.priority },
      { onSuccess: () => setAddedTitles((prev) => new Set(prev).add(task.title)) },
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-atlas-violet to-atlas-cyan">
            <Sparkles className="h-4 w-4 text-atlas-ink" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">AI Assistant</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Describe what you want to accomplish, and let AtlasAI break it into tasks.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleGenerate}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-6 space-y-3"
      >
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Launch a new marketing blog for our product"
          rows={3}
          className="w-full rounded-xl border border-atlas-panel-border bg-atlas-panel/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-atlas-violet/50 focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-md border border-atlas-panel-border bg-atlas-ink px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select a project to add tasks to...</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            disabled={generateTasks.isPending || !goal.trim()}
            className="ml-auto flex items-center gap-2 bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90 disabled:opacity-50"
          >
            {generateTasks.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate tasks
              </>
            )}
          </Button>
        </div>

        {generateTasks.isError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Something went wrong generating tasks. Please try again.
          </p>
        )}
      </motion.form>

      <AnimatePresence>
        {tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 space-y-2 overflow-hidden"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {tasks.length} tasks generated
              {!selectedProjectId && ' — select a project above to add them'}
            </p>
            {tasks.map((task, i) => {
              const added = addedTitles.has(task.title);
              return (
                <motion.div
                  key={task.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-start gap-3 rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Flag className="h-3 w-3" style={{ color: PRIORITY_COLOR[task.priority] }} />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {task.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">{task.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant={added ? 'ghost' : 'outline'}
                    disabled={!selectedProjectId || added || createTask.isPending}
                    onClick={() => handleAddTask(task)}
                    className="shrink-0"
                  >
                    {added ? (
                      <span className="flex items-center gap-1 text-atlas-cyan">
                        <Check className="h-3.5 w-3.5" />
                        Added
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </span>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}