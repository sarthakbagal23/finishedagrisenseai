import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusKind = 'good' | 'warn' | 'bad';
const MAP = {
  good: { icon: CheckCircle2, word: 'In range', tone: 'text-good' },
  warn: { icon: AlertTriangle, word: 'Watch', tone: 'text-warn' },
  bad: { icon: AlertOctagon, word: 'Out of range', tone: 'text-bad' },
} as const;

/** Status is never colour alone: icon + word + colour. */
export function Status({ kind, word, className }: { kind: StatusKind; word?: string; className?: string }) {
  const m = MAP[kind];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-semibold', m.tone, className)}>
      <m.icon className="w-4 h-4" aria-hidden />
      {word ?? m.word}
    </span>
  );
}
