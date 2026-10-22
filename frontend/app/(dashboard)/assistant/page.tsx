'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { AgentChat } from '@/components/assistant/agent-chat';
import { TaskGenerator } from '@/components/assistant/task-generator';

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'generate', label: 'Generate tasks' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AssistantPage() {
  const [tab, setTab] = useState<TabId>('chat');

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-atlas-violet to-atlas-cyan">
            <Sparkles className="h-4 w-4 text-atlas-ink" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">AI Assistant</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Talk to AtlasAI about your workspace, or turn a goal into a task list.
        </p>

        <div className="mt-4 flex gap-1 border-b border-atlas-panel-border">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
                tab === id
                  ? 'border-atlas-cyan text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {tab === 'chat' ? <AgentChat /> : <TaskGenerator />}
      </div>
    </div>
  );
}