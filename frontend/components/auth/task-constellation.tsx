'use client';

import { motion } from 'framer-motion';

interface ConstellationCard {
  id: string;
  label: string;
  status: 'done' | 'active' | 'pending';
  top: string;
  left: string;
  delay: number;
}

const CARDS: ConstellationCard[] = [
  { id: 'c1', label: 'Design system audit', status: 'done', top: '10%', left: '18%', delay: 0 },
  { id: 'c2', label: 'API rate limiting', status: 'active', top: '28%', left: '60%', delay: 0.15 },
  { id: 'c3', label: 'Onboarding flow v2', status: 'pending', top: '48%', left: '20%', delay: 0.3 },
  { id: 'c4', label: 'Sprint retro notes', status: 'done', top: '56%', left: '66%', delay: 0.45 },
  { id: 'c5', label: 'AI summary draft', status: 'active', top: '72%', left: '40%', delay: 0.6 },
];

const CONNECTIONS: [string, string][] = [
  ['c1', 'c2'],
  ['c2', 'c4'],
  ['c1', 'c3'],
  ['c3', 'c5'],
  ['c2', 'c5'],
];

const STATUS_COLOR: Record<ConstellationCard['status'], string> = {
  done: '#22D3EE',
  active: '#8B5CF6',
  pending: '#71717A',
};

function getCard(id: string) {
  return CARDS.find((c) => c.id === id)!;
}

export function TaskConstellation() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ambient glow */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-atlas-violet/10 blur-[120px]" />

      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {CONNECTIONS.map(([fromId, toId], i) => {
          const from = getCard(fromId);
          const to = getCard(toId);
          return (
            <motion.line
              key={`${fromId}-${toId}`}
              x1={from.left}
              y1={from.top}
              x2={to.left}
              y2={to.top}
              stroke="url(#lineGradient)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 1.2, delay: 0.5 + i * 0.15, ease: 'easeOut' }}
            />
          );
        })}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>

      {CARDS.map((card) => (
        <motion.div
          key={card.id}
          className="absolute w-44 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-atlas-panel-border bg-atlas-panel/80 px-3 py-2.5 backdrop-blur-sm"
          style={{ top: card.top, left: card.left }}
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -6, 0],
          }}
          transition={{
            opacity: { duration: 0.5, delay: card.delay },
            scale: { duration: 0.5, delay: card.delay },
            y: { duration: 4 + card.delay * 2, repeat: Infinity, ease: 'easeInOut', delay: card.delay },
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STATUS_COLOR[card.status] }}
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-atlas-panel-border">
              {card.status}
            </span>
          </div>
          <p className="mt-1.5 text-xs font-medium leading-snug text-foreground/90">{card.label}</p>
        </motion.div>
      ))}
    </div>
  );
}