'use client';

import { PlusCircle, ArrowRightLeft, Pencil, MessageSquare } from 'lucide-react';
import { useTaskActivity, type ActivityEntry } from '@/hooks/use-activity';

const ACTION_CONFIG: Record<string, { icon: typeof PlusCircle; color: string }> = {
  'task.created': { icon: PlusCircle, color: '#22D3EE' },
  'task.status_changed': { icon: ArrowRightLeft, color: '#8B5CF6' },
  'task.updated': { icon: Pencil, color: '#71717A' },
  'task.commented': { icon: MessageSquare, color: '#FBBF24' },
};

const STATUS_LABEL: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function describeEntry(entry: ActivityEntry): string {
  const name = entry.user.firstName;
  switch (entry.action) {
    case 'task.created':
      return `${name} created this task`;
    case 'task.status_changed': {
      const from = String(entry.metadata?.from ?? '');
      const to = String(entry.metadata?.to ?? '');
      return `${name} moved this from ${STATUS_LABEL[from] ?? from} to ${STATUS_LABEL[to] ?? to}`;
    }
    case 'task.updated':
      return `${name} updated this task`;
    case 'task.commented':
      return `${name} commented`;
    default:
      return `${name} did something`;
  }
}

interface ActivityTimelineProps {
  orgId: string;
  projectId: string;
  taskId: string;
}

export function ActivityTimeline({ orgId, projectId, taskId }: ActivityTimelineProps) {
  const { data: activity, isLoading } = useTaskActivity(orgId, projectId, taskId);

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading activity...</p>;
  }

  if (!activity || activity.length === 0) {
    return <p className="text-xs text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {activity.map((entry, i) => {
        const config = ACTION_CONFIG[entry.action] ?? { icon: Pencil, color: '#71717A' };
        const Icon = config.icon;
        const isLast = i === activity.length - 1;

        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${config.color}1A` }}
              >
                <Icon className="h-3 w-3" style={{ color: config.color }} />
              </div>
              {!isLast && <div className="mt-1 w-px flex-1 bg-atlas-panel-border" />}
            </div>
            <div className="pb-3">
              <p className="text-xs text-foreground">{describeEntry(entry)}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(entry.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}