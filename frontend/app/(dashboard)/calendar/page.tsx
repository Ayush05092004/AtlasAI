'use client';

import { useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useActiveOrgId } from '@/hooks/use-projects';
import { useCalendarTasks, type CalendarTask } from '@/hooks/use-calendar';
import { TaskDetailModal } from '@/components/tasks/task-detail-modal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CHIPS = 3;

const PRIORITY_COLOR: Record<CalendarTask['priority'], string> = {
  LOW: '#71717A',
  MEDIUM: '#22D3EE',
  HIGH: '#FBBF24',
  URGENT: '#F87171',
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function buildGrid(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// True only in the browser, so the calendar (which depends on "today") never
// renders on the server and can't cause a hydration mismatch.
const subscribe = () => () => undefined;

export default function CalendarPage() {
  const orgId = useActiveOrgId();
  const queryClient = useQueryClient();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<CalendarTask | null>(null);

  const grid = buildGrid(cursor);
  const from = `${dayKey(grid[0])}T00:00:00.000Z`;
  const to = `${dayKey(grid[grid.length - 1])}T23:59:59.999Z`;
  const { data: tasks, isLoading } = useCalendarTasks(from, to);

  if (!mounted) {
    return <p className="px-8 py-10 text-sm text-muted-foreground">Loading...</p>;
  }

  // Due dates are stored as calendar dates, so the YYYY-MM-DD part is the day.
  const byDay: Record<string, CalendarTask[]> = {};
  for (const task of tasks ?? []) {
    if (!task.dueDate) continue;
    const key = task.dueDate.slice(0, 10);
    const list = byDay[key] ?? [];
    list.push(task);
    byDay[key] = list;
  }

  const todayKey = dayKey(new Date());
  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const changeMonth = (delta: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  const goToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(todayKey);
  };

  const selectedTasks = selectedDay ? (byDay[selectedDay] ?? []) : [];
  const isOverdue = (task: CalendarTask, key: string) => task.status !== 'DONE' && key < todayKey;

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every task with a due date, across all projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="rounded-md border border-atlas-panel-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Today
          </button>
          <div className="flex items-center rounded-md border border-atlas-panel-border">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-36 text-center text-sm font-medium text-foreground">{monthLabel}</span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 overflow-hidden rounded-xl border border-atlas-panel-border bg-atlas-panel/30">
        <div className="grid grid-cols-7 border-b border-atlas-panel-border">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((day) => {
            const key = dayKey(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const dayTasks = byDay[key] ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;

            return (
              <div
                key={key}
                className={`min-h-28 border-b border-r border-atlas-panel-border/60 p-1.5 ${
                  inMonth ? '' : 'bg-black/20'
                } ${isSelected ? 'bg-atlas-violet/[0.06]' : ''}`}
              >
                <button
                  onClick={() => setSelectedDay(key)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? 'bg-gradient-to-br from-atlas-violet to-atlas-cyan font-semibold text-atlas-ink'
                      : inMonth
                        ? 'text-foreground hover:bg-white/[0.06]'
                        : 'text-muted-foreground/50 hover:bg-white/[0.06]'
                  }`}
                >
                  {day.getDate()}
                </button>

                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, MAX_CHIPS).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setOpenTask(task)}
                      title={`${task.project.key}-${task.number} ${task.title}`}
                      className={`flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-[10px] hover:bg-white/[0.06] ${
                        task.status === 'DONE'
                          ? 'text-muted-foreground line-through'
                          : isOverdue(task, key)
                            ? 'text-destructive'
                            : 'text-foreground'
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
                      />
                      <span className="truncate">{task.title}</span>
                    </button>
                  ))}
                  {dayTasks.length > MAX_CHIPS && (
                    <button
                      onClick={() => setSelectedDay(key)}
                      className="px-1.5 text-[10px] text-atlas-cyan hover:underline"
                    >
                      +{dayTasks.length - MAX_CHIPS} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isLoading && <p className="mt-3 text-xs text-muted-foreground">Loading tasks...</p>}

      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-atlas-panel-border bg-atlas-panel/50"
        >
          <div className="flex items-center justify-between border-b border-atlas-panel-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">
              {new Date(`${selectedDay}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            <button onClick={() => setSelectedDay(null)} className="text-xs text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>
          {selectedTasks.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted-foreground">Nothing due on this day.</p>
          ) : (
            <ul className="divide-y divide-atlas-panel-border">
              {selectedTasks.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => setOpenTask(task)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03]"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{task.title}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        <span className="font-mono">
                          {task.project.key}-{task.number}
                        </span>{' '}
                        - {task.project.name}
                        {task.assignee ? ` - ${task.assignee.firstName}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}

      {openTask && orgId && (
        <TaskDetailModal
          orgId={orgId}
          projectId={openTask.project.id}
          taskId={openTask.id}
          onClose={() => {
            setOpenTask(null);
            void queryClient.invalidateQueries({ queryKey: ['calendar'] });
          }}
        />
      )}
    </div>
  );
}