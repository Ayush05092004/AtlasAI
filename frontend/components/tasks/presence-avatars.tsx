'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePresence } from '@/hooks/use-presence';

interface PresenceAvatarsProps {
  projectId: string;
}

export function PresenceAvatars({ projectId }: PresenceAvatarsProps) {
  const { viewers } = usePresence(projectId);

  if (viewers.length === 0) return null;

  return (
    <div className="flex items-center">
      <AnimatePresence mode="popLayout">
        {viewers.map((viewer, i) => (
          <motion.div
            key={viewer.userId}
            initial={{ opacity: 0, scale: 0.5, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ marginLeft: i === 0 ? 0 : -8, zIndex: viewers.length - i }}
            className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-atlas-ink bg-gradient-to-br from-atlas-violet to-atlas-cyan text-[10px] font-semibold text-atlas-ink"
            title={`${viewer.firstName} ${viewer.lastName} is viewing this project`}
          >
            {viewer.firstName[0]}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-atlas-ink bg-atlas-cyan" />
          </motion.div>
        ))}
      </AnimatePresence>
      <span className="ml-2 text-[11px] text-muted-foreground">
        {viewers.length === 1 ? 'viewing now' : `${viewers.length} viewing now`}
      </span>
    </div>
  );
}