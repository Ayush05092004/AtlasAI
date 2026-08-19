import { TaskConstellation } from '@/components/auth/task-constellation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-atlas-ink">
      {/* Left: form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[480px] lg:shrink-0 xl:w-[560px]">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-atlas-violet to-atlas-cyan">
              <span className="font-display text-sm font-bold text-atlas-ink">A</span>
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">AtlasAI</span>
          </div>
          {children}
        </div>
      </div>

      {/* Right: animated visual, hidden on smaller screens */}
      <div className="relative hidden flex-1 border-l border-atlas-panel-border bg-atlas-panel/40 lg:block">
        <TaskConstellation />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="font-display text-2xl font-medium leading-tight text-foreground/90">
            Every task, connected.
            <br />
            Every update, understood.
          </p>
          <p className="mt-3 max-w-md font-mono text-xs text-muted-foreground">
            AtlasAI tracks how your work relates — not just what&apos;s done.
          </p>
        </div>
      </div>
    </div>
  );
}