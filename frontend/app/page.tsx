'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, FolderKanban, Sparkles, Zap, Users } from 'lucide-react';
import { TaskConstellation } from '@/components/auth/task-constellation';

const FEATURES = [
  {
    icon: FolderKanban,
    title: 'Real kanban, real fast',
    description: 'Drag tasks across a live board with instant, optimistic updates — no lag, no page reloads.',
  },
  {
    icon: Sparkles,
    title: 'AI that understands your work',
    description: 'Generate tasks, summarize sprints, and get answers about your project — coming in v1.2.',
  },
  {
    icon: Users,
    title: 'Built for teams',
    description: 'Every account gets a workspace. Invite your team, assign work, and track it together.',
  },
  {
    icon: Zap,
    title: 'No setup tax',
    description: 'Create a project, add tasks, and start moving work in under a minute.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-atlas-ink text-foreground">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-atlas-violet to-atlas-cyan">
            <span className="font-display text-xs font-bold text-atlas-ink">A</span>
          </div>
          <span className="font-display text-sm font-semibold tracking-tight">AtlasAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-r from-atlas-violet to-atlas-cyan px-4 py-2 text-sm font-medium text-atlas-ink transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <motion.div initial="initial" animate="animate" variants={fadeUp} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-atlas-panel-border bg-atlas-panel/60 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-atlas-cyan">
            <Sparkles className="h-3 w-3" />
            Now in v1.0
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-foreground lg:text-5xl">
            Project management that thinks ahead.
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Plan, track, and ship work with a kanban board that feels instant — and an AI
            assistant that&apos;s learning your project as you go.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-atlas-violet to-atlas-cyan px-5 py-2.5 text-sm font-medium text-atlas-ink transition-opacity hover:opacity-90"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-atlas-panel-border px-5 py-2.5 text-sm text-foreground transition-colors hover:bg-white/[0.03]"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative h-80 rounded-2xl border border-atlas-panel-border bg-atlas-panel/40 lg:h-96"
        >
          <TaskConstellation />
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.h2
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.4 }}
          className="font-display text-2xl font-semibold tracking-tight text-foreground"
        >
          Everything a team needs, nothing it doesn&apos;t.
        </motion.h2>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-5"
            >
              <feature.icon className="h-5 w-5 text-atlas-cyan" />
              <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-atlas-panel-border bg-gradient-to-br from-atlas-violet/10 to-atlas-cyan/10 p-10 text-center"
        >
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Ready to see it in action?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create your workspace in seconds. No credit card, no setup wizard.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-atlas-violet to-atlas-cyan px-5 py-2.5 text-sm font-medium text-atlas-ink transition-opacity hover:opacity-90"
          >
            Create your workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-atlas-panel-border px-6 py-8 text-center text-xs text-muted-foreground">
        Built by Ayush · AtlasAI is a portfolio project in active development
      </footer>
    </div>
  );
}