'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Flag, Calendar, Check, Loader2 } from 'lucide-react';
import { useQuickAddParse } from '@/hooks/use-quick-add';
import { useCreateTask } from '@/hooks/use-tasks';

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#71717A',
  MEDIUM: '#22D3EE',
  HIGH: '#FBBF24',
  URGENT: '#F87171',
};

interface QuickAddBarProps {
  orgId: string;
  projectId: string;
}

interface Parsed {
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
}

export function QuickAddBar({ orgId, projectId }: QuickAddBarProps) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const parseTask = useQuickAddParse();
  const createTask = useCreateTask(orgId, projectId);
  const [justAdded, setJustAdded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || parseTask.isPending) return;

    parseTask.mutate(text, {
      onSuccess: (result) => setParsed(result),
    });
  };

  const handleConfirm = () => {
    if (!parsed) return;
    createTask.mutate(
      { title: parsed.title, priority: parsed.priority },
      {
        onSuccess: () => {
          setParsed(null);
          setText('');
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 2000);
        },
      },
    );
  };

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit} className="relative">
        <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-violet" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Try "Fix login bug urgent tomorrow" and press Enter...'
          disabled={parseTask.isPending}
          className="w-full rounded-lg border border-atlas-panel-border bg-atlas-panel/50 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-atlas-violet/50 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!text.trim() || parseTask.isPending}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-atlas-cyan disabled:opacity-30"
        >
          {parseTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      <AnimatePresence>
        {parsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden"
          >
            <div className="flex items-center justify-between rounded-lg border border-atlas-violet/30 bg-atlas-violet/[0.05] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <p className="truncate text-sm font-medium text-foreground">{parsed.title}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <Flag className="h-3 w-3" style={{ color: PRIORITY_COLOR[parsed.priority] }} />
                  <span className="text-[10px] text-muted-foreground">{parsed.priority}</span>
                </div>
                {parsed.dueDate && (
                  <div className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(parsed.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={createTask.isPending}
                  className="rounded-md bg-gradient-to-r from-atlas-violet to-atlas-cyan px-3 py-1 text-xs font-medium text-atlas-ink hover:opacity-90 disabled:opacity-50"
                >
                  {createTask.isPending ? 'Adding...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setParsed(null)}
                  className="rounded-md border border-atlas-panel-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Discard
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {justAdded && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-1.5 text-xs text-atlas-cyan"
          >
            <Check className="h-3.5 w-3.5" />
            Task added
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}