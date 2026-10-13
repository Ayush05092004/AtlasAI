'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Flag, Calendar, X, SlidersHorizontal } from 'lucide-react';
import { useAdvancedSearch, useAssignableUsers, type SearchFilters } from '@/hooks/use-advanced-search';

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#71717A',
  MEDIUM: '#22D3EE',
  HIGH: '#FBBF24',
  URGENT: '#F87171',
};

const EMPTY_FILTERS: SearchFilters = {
  query: '',
  assigneeId: '',
  priority: '',
  status: '',
  dueBefore: '',
  dueAfter: '',
};

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const { data: results, isFetching } = useAdvancedSearch(filters);
  const { data: users } = useAssignableUsers();

  const update = (key: keyof SearchFilters, value: string) => setFilters((f) => ({ ...f, [key]: value }));
  const clearFilters = () => setFilters(EMPTY_FILTERS);
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'query' && v).length;

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find tasks and projects across your workspace.</p>
      </motion.div>

      <div className="mt-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filters.query}
            onChange={(e) => update('query', e.target.value)}
            placeholder="Search tasks, projects..."
            className="w-full rounded-lg border border-atlas-panel-border bg-atlas-panel/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-atlas-violet/50 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'border-atlas-violet/50 bg-atlas-violet/10 text-foreground'
              : 'border-atlas-panel-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-atlas-violet px-1.5 text-[10px] text-atlas-ink">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 grid grid-cols-2 gap-3 overflow-hidden rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-4 sm:grid-cols-3"
        >
          <div>
            <label className="text-[11px] text-muted-foreground">Assignee</label>
            <select
              value={filters.assigneeId}
              onChange={(e) => update('assigneeId', e.target.value)}
              className="mt-1 w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-2 py-1.5 text-xs text-foreground"
            >
              <option value="">Anyone</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => update('priority', e.target.value)}
              className="mt-1 w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-2 py-1.5 text-xs text-foreground"
            >
              <option value="">Any</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Status</label>
            <select
              value={filters.status}
              onChange={(e) => update('status', e.target.value)}
              className="mt-1 w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-2 py-1.5 text-xs text-foreground"
            >
              <option value="">Any</option>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Due after</label>
            <input
              type="date"
              value={filters.dueAfter}
              onChange={(e) => update('dueAfter', e.target.value)}
              className="mt-1 w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-2 py-1.5 text-xs text-foreground"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Due before</label>
            <input
              type="date"
              value={filters.dueBefore}
              onChange={(e) => update('dueBefore', e.target.value)}
              className="mt-1 w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-2 py-1.5 text-xs text-foreground"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-6">
        {isFetching && <p className="text-sm text-muted-foreground">Searching...</p>}

        {!isFetching && results && results.tasks.length === 0 && results.projects.length === 0 && (
          <p className="text-sm text-muted-foreground">No results.</p>
        )}

        {results && results.tasks.length > 0 && (
          <div className="space-y-2">
            {results.tasks.map((task) => (
              <Link
                key={task.id}
                href={`/projects/${task.project.id}`}
                className="flex items-center gap-3 rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-3.5 transition-colors hover:border-atlas-violet/40"
              >
                <Flag className="h-3.5 w-3.5 shrink-0" style={{ color: PRIORITY_COLOR[task.priority] }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono">
                      {task.project.key}-{task.number}
                    </span>
                    <span>-</span>
                    <span>{task.project.name}</span>
                    {task.assignee && (
                      <>
                        <span>-</span>
                        <span>{task.assignee.firstName}</span>
                      </>
                    )}
                  </div>
                </div>
                {task.dueDate && (
                  <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}