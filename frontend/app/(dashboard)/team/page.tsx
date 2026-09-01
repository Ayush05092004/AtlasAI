'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, X, Copy, Check, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMembers, usePendingInvites, useCreateInvite, useRevokeInvite } from '@/hooks/use-team';

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});
type InviteValues = z.infer<typeof inviteSchema>;

const ROLE_COLOR: Record<string, string> = {
  OWNER: '#8B5CF6',
  ADMIN: '#22D3EE',
  MEMBER: '#71717A',
  VIEWER: '#71717A',
};

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/accept-invite?token=${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md border border-atlas-panel-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3 text-atlas-cyan" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}

export default function TeamPage() {
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: invites, isLoading: invitesLoading } = usePendingInvites();
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();
  const [showForm, setShowForm] = useState(false);
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteValues>({ resolver: zodResolver(inviteSchema), defaultValues: { role: 'MEMBER' } });

  const onSubmit = (values: InviteValues) => {
    createInvite.mutate(values, {
      onSuccess: (invite) => {
        reset();
        setShowForm(false);
        setLastInviteToken(invite.token);
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage who has access to this workspace.</p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Invite teammate
        </Button>
      </div>

      {lastInviteToken && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 flex items-center justify-between rounded-md border border-atlas-cyan/30 bg-atlas-cyan/10 px-4 py-3"
        >
          <p className="text-xs text-foreground">Invite created — share this link with them:</p>
          <div className="flex items-center gap-2">
            <CopyLinkButton token={lastInviteToken} />
            <button onClick={() => setLastInviteToken(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 overflow-hidden rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-5"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" placeholder="teammate@company.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                {...register('role')}
                className="w-full rounded-md border border-atlas-panel-border bg-atlas-ink px-3 py-2 text-sm text-foreground"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
          </div>

          {createInvite.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Couldn&apos;t send the invite. They may already be a member.
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createInvite.isPending}
              className="bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90"
            >
              {createInvite.isPending ? 'Creating...' : 'Create invite'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </motion.form>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-medium text-foreground">Members</h2>
        <div className="mt-3 rounded-xl border border-atlas-panel-border bg-atlas-panel/50">
          {membersLoading && <p className="px-4 py-4 text-xs text-muted-foreground">Loading...</p>}
          <ul className="divide-y divide-atlas-panel-border">
            {members?.map((member) => (
              <li key={member.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-atlas-violet/50 to-atlas-cyan/50 text-xs font-semibold text-foreground">
                    {member.user.firstName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: ROLE_COLOR[member.role], backgroundColor: `${ROLE_COLOR[member.role]}1A` }}
                >
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(invites?.length ?? 0) > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-foreground">Pending invites</h2>
          <div className="mt-3 rounded-xl border border-atlas-panel-border bg-atlas-panel/50">
            {invitesLoading && <p className="px-4 py-4 text-xs text-muted-foreground">Loading...</p>}
            <ul className="divide-y divide-atlas-panel-border">
              {invites?.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-foreground">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited as {invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyLinkButton token={invite.token} />
                    <button
                      onClick={() => revokeInvite.mutate(invite.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Revoke invite"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}