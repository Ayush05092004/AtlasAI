'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { useAuthStore } from '@/stores/auth-store';

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ChatPage() {
  const { messages, isLoading, sendMessage } = useChat();
  const currentUser = useAuthStore((s) => s.user);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-3xl flex-col px-8 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="shrink-0"
      >
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Team Chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time, for your whole workspace.</p>
      </motion.div>

      <div className="mt-6 flex-1 overflow-y-auto rounded-xl border border-atlas-panel-border bg-atlas-panel/30 p-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading messages...</p>}

        {!isLoading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Say hello to your team.</p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((msg) => {
            const isMine = msg.author.id === currentUser?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-atlas-violet/50 to-atlas-cyan/50 text-[10px] font-semibold text-foreground">
                  {msg.author.firstName[0]}
                </div>
                <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-medium text-foreground">
                      {isMine ? 'You' : msg.author.firstName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(msg.createdAt)}</span>
                  </div>
                  <div
                    className={`mt-1 rounded-xl px-3 py-2 text-sm ${
                      isMine
                        ? 'bg-gradient-to-br from-atlas-violet to-atlas-cyan text-atlas-ink'
                        : 'bg-atlas-panel border border-atlas-panel-border text-foreground'
                    }`}
                  >
                    {msg.body}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex shrink-0 items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-atlas-panel-border bg-atlas-panel/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-atlas-violet/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}