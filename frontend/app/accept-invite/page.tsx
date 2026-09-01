'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AxiosError } from 'axios';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useAcceptInvite } from '@/hooks/use-team';

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const accessToken = useAuthStore((s) => s.accessToken);
  const acceptInvite = useAcceptInvite();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token || !accessToken || acceptInvite.isPending || status !== 'idle') return;

    acceptInvite.mutate(token, {
      onSuccess: () => setStatus('success'),
      onError: (err: AxiosError<{ message?: string }>) => {
        setStatus('error');
        setErrorMessage(err.response?.data?.message ?? 'This invite could not be accepted.');
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when token/accessToken actually change, not on every acceptInvite identity change
  }, [token, accessToken]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-atlas-ink px-4">
        <div className="text-center">
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-3 text-sm text-foreground">This invite link is missing its token.</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-atlas-ink px-4">
        <div className="w-full max-w-sm rounded-xl border border-atlas-panel-border bg-atlas-panel/60 p-8 text-center">
          <p className="text-sm text-foreground">You need to sign in to accept this invite.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href={`/login?redirect=/accept-invite?token=${token}`}
              className="rounded-lg bg-gradient-to-r from-atlas-violet to-atlas-cyan px-4 py-2 text-sm font-medium text-atlas-ink"
            >
              Sign in
            </Link>
            <Link
              href={`/register?redirect=/accept-invite?token=${token}`}
              className="rounded-lg border border-atlas-panel-border px-4 py-2 text-sm text-foreground"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-atlas-ink px-4">
      <div className="w-full max-w-sm rounded-xl border border-atlas-panel-border bg-atlas-panel/60 p-8 text-center">
        {status === 'idle' && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-atlas-cyan" />
            <p className="mt-3 text-sm text-muted-foreground">Accepting invite...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-atlas-cyan" />
            <p className="mt-3 text-sm text-foreground">You&apos;ve joined the workspace.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-5 rounded-lg bg-gradient-to-r from-atlas-violet to-atlas-cyan px-4 py-2 text-sm font-medium text-atlas-ink"
            >
              Go to dashboard
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="mt-3 text-sm text-foreground">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  );
}