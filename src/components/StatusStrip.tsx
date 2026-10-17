"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleDot, FlaskConical, Radio, Table2 } from 'lucide-react';

// What every figure on a page actually is. Honest labels beat a fake "live" badge.
type Kind = 'live' | 'simulated' | 'sample' | 'synthetic';
const KIND = {
  live: { icon: Radio, word: 'Live', tone: 'text-good' },
  simulated: { icon: CircleDot, word: 'Simulated', tone: 'text-warn' },
  sample: { icon: Table2, word: 'Sample data', tone: 'text-muted-foreground' },
  synthetic: { icon: FlaskConical, word: 'Synthetic', tone: 'text-model-ink' },
} as const;

const BY_ROUTE: Record<string, [string, Kind][]> = {
  '/': [['Sensor readings', 'simulated'], ['Weather', 'live']],
  '/sensors': [['Live feed', 'simulated'], ['7-day history', 'sample']],
  '/prices': [['Mandi prices', 'sample']],
  '/research': [['Dataset and models', 'synthetic']],
  '/weather': [['Forecast', 'live']],
};

export function StatusStrip() {
  const path = usePathname();
  const items = BY_ROUTE[path];
  if (!items) return null;
  return (
    <div className="border-b border-border bg-muted/50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 min-h-9 py-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        {items.map(([label, kind]) => {
          const k = KIND[kind];
          return (
            <span key={label} className="inline-flex items-center gap-1.5 text-muted-foreground">
              <k.icon className={`w-3.5 h-3.5 ${k.tone}`} aria-hidden />
              {label}: <strong className="font-semibold text-foreground">{k.word}</strong>
            </span>
          );
        })}
        <Link href="/methods" className="ml-auto underline underline-offset-2 text-muted-foreground hover:text-foreground">How data is sourced</Link>
      </div>
    </div>
  );
}
