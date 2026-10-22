'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAgentChat, type AgentAction } from '@/hooks/use-ai-agent';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  actions?: AgentAction[];
  isError?: boolean;
}

const SUGGESTIONS = [
  'What tasks are overdue?',
  'Give me an overview of my projects',
  'What should I work on today?',
  'Create a high priority task to fix the login bug, due tomorrow',
];

export function AgentChat() {
  const agent = useAgentChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const idRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, agent.isPending]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || agent.isPending) return;

    // History = everything said so far (without error bubbles), before this new message.
    const history = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: trimmed }]);
    setDraft('');

    agent.mutate(
      { message: trimmed, history },
      {
        onSuccess: (data) =>
          setMessages((prev) => [
            ...prev,
            { id: nextId(), role: 'assistant', content: data.reply, actions: data.actions },
          ]),
        onError: () =>
          setMessages((prev) => [
            ...prev,
            {
              id: nextId(),
              role: 'assistant',
              content: 'Sorry, something went wrong reaching the AI. Please try again in a moment.',
              isError: true,
            },
          ]),
      },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-atlas-panel-border bg-atlas-panel/30 p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-atlas-violet to-atlas-cyan">
              <Sparkles className="h-5 w-5 text-atlas-ink" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">Ask AtlasAI anything about your work</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              It can look up tasks, create them, move them between columns, assign people and add comments.
            </p>
            <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-atlas-panel-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-atlas-violet/50 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-atlas-violet to-atlas-cyan">
                    <Sparkles className="h-3.5 w-3.5 text-atlas-ink" />
                  </div>
                )}
                <div className={`flex max-w-[80%] flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  {message.actions?.map((action, i) => (
                    <div
                      key={`${message.id}-${i}`}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] ${
                        action.ok
                          ? 'border-atlas-cyan/30 bg-atlas-cyan/10 text-atlas-cyan'
                          : 'border-destructive/30 bg-destructive/10 text-destructive'
                      }`}
                    >
                      {action.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {action.summary}
                    </div>
                  ))}
                  <div
                    className={`whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                      isUser
                        ? 'bg-gradient-to-br from-atlas-violet to-atlas-cyan text-atlas-ink'
                        : message.isError
                          ? 'border border-destructive/30 bg-destructive/10 text-destructive'
                          : 'border border-atlas-panel-border bg-atlas-panel text-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {agent.isPending && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-atlas-violet to-atlas-cyan">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-atlas-ink" />
              </div>
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex shrink-0 items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask AtlasAI or tell it what to do..."
          disabled={agent.isPending}
          className="flex-1 rounded-lg border border-atlas-panel-border bg-atlas-panel/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-atlas-violet/50 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!draft.trim() || agent.isPending}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}