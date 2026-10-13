'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Webhook, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWebhooks, useCreateWebhook, useDeleteWebhook } from '@/hooks/use-webhooks';

const EVENT_OPTIONS = [
  { value: 'task.created', label: 'Task created' },
  { value: 'task.status_changed', label: 'Task status changed' },
  { value: 'task.commented', label: 'Task commented' },
  { value: 'project.created', label: 'Project created' },
];

export default function IntegrationsPage() {
  const { data: webhooks, isLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [event, setEvent] = useState(EVENT_OPTIONS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWebhook.mutate(
      { name, url, event },
      {
        onSuccess: () => {
          setName('');
          setUrl('');
          setShowForm(false);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Integrations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Send real-time events to Slack, Discord, Zapier, or any webhook URL.
            </p>
          </div>
          <Button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New webhook
          </Button>
        </div>
      </motion.div>

      {showForm && (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 space-y-4 overflow-hidden rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="webhook-name">Name</Label>
            <Input id="webhook-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Slack alerts" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="webhook-url">URL</Label>
            <Input
              id="webhook-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.slack.com/..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="webhook-event">Trigger on</Label>
            <select
              id="webhook-event"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-3 py-2 text-sm text-foreground"
            >
              {EVENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createWebhook.isPending || !name || !url}
              className="bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90"
            >
              {createWebhook.isPending ? 'Creating...' : 'Create webhook'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </motion.form>
      )}

      <div className="mt-6 rounded-xl border border-atlas-panel-border bg-atlas-panel/50">
        {isLoading && <p className="px-4 py-6 text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && webhooks?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Webhook className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No webhooks yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Connect AtlasAI to your other tools.</p>
          </div>
        )}
        <ul className="divide-y divide-atlas-panel-border">
          {webhooks?.map((wh) => (
            <li key={wh.id} className="flex items-center justify-between px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{wh.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {wh.url} · {EVENT_OPTIONS.find((o) => o.value === wh.event)?.label}
                </p>
              </div>
              <button
                onClick={() => deleteWebhook.mutate(wh.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}