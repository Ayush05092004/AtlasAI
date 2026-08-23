'use client';

import { useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/use-comments';

interface CommentThreadProps {
  orgId: string;
  projectId: string;
  taskId: string;
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CommentThread({ orgId, projectId, taskId }: CommentThreadProps) {
  const { data: comments, isLoading } = useComments(orgId, projectId, taskId);
  const addComment = useAddComment(orgId, projectId, taskId);
  const deleteComment = useDeleteComment(orgId, projectId, taskId);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [draft, setDraft] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addComment.mutate(draft, { onSuccess: () => setDraft('') });
  };

  return (
    <div className="border-t border-atlas-panel-border pt-4">
      <h3 className="text-xs font-medium text-muted-foreground">
        Comments {comments?.length ? `(${comments.length})` : ''}
      </h3>

      <div className="mt-3 max-h-48 space-y-3 overflow-y-auto">
        {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
        {!isLoading && comments?.length === 0 && (
          <p className="text-xs text-muted-foreground">No comments yet. Start the discussion.</p>
        )}
        {comments?.map((comment) => (
          <div key={comment.id} className="group flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-atlas-violet/50 to-atlas-cyan/50 text-[10px] font-semibold text-foreground">
              {comment.author.firstName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-foreground">
                  {comment.author.firstName} {comment.author.lastName}
                </span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                {comment.author.id === currentUserId && (
                  <button
                    onClick={() => deleteComment.mutate(comment.id)}
                    className="ml-auto text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground/90">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-md border border-atlas-panel-border bg-atlas-ink px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={addComment.isPending || !draft.trim()}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}