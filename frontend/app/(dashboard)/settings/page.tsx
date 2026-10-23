'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useProfile, useUpdateProfile, useChangePassword, type Profile } from '@/hooks/use-profile';

function errorText(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === 'string') return message;
  }
  return fallback;
}

const gradientButton =
  'bg-gradient-to-r from-atlas-violet to-atlas-cyan text-atlas-ink font-medium hover:opacity-90 disabled:opacity-50';

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-5">
      <h2 className="font-display text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [jobTitle, setJobTitle] = useState(profile.jobTitle ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ firstName, lastName, jobTitle });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="jobTitle">Job title</Label>
        <Input
          id="jobTitle"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. Product Designer"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={profile.email} disabled />
      </div>

      {updateProfile.isError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errorText(updateProfile.error, 'Could not save your profile.')}
        </p>
      )}
      {updateProfile.isSuccess && <p className="text-xs text-atlas-cyan">Profile saved.</p>}

      <Button
        type="submit"
        disabled={updateProfile.isPending || !firstName.trim() || !lastName.trim()}
        className={gradientButton}
      >
        {updateProfile.isPending ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (newPassword !== confirm) {
      setLocalError('The new passwords do not match.');
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9\W]/.test(newPassword)) {
      setLocalError('Use at least 8 characters with upper and lower case letters and a number or symbol.');
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          // All sessions were revoked on the server, so sign in again with the new password.
          setTimeout(() => {
            logout();
            router.push('/login');
          }, 1500);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>

      {(localError || changePassword.isError) && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {localError || errorText(changePassword.error, 'Could not change your password.')}
        </p>
      )}
      {changePassword.isSuccess && (
        <p className="text-xs text-atlas-cyan">Password changed. Signing you out so you can log in again...</p>
      )}

      <Button
        type="submit"
        disabled={changePassword.isPending || changePassword.isSuccess || !currentPassword || !newPassword || !confirm}
        className={gradientButton}
      >
        {changePassword.isPending ? 'Updating...' : 'Change password'}
      </Button>
    </form>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();

  const handleSignOut = async () => {
    const { refreshToken, logout } = useAuthStore.getState();
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Sign out locally even if the server call fails.
    }
    logout();
    router.push('/login');
  };

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile and account security.</p>
      </motion.div>

      <div className="mt-8 space-y-4">
        {isLoading || !profile ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <Section title="Profile" description="How you appear to your teammates.">
              <ProfileForm profile={profile} />
            </Section>
            <Section title="Password" description="Changing it signs you out of every device.">
              <PasswordForm />
            </Section>
            <Section title="Session" description="Sign out of AtlasAI on this device.">
              <Button type="button" variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}