import { cn } from '@/lib/utils';
import { Status, StatusKind } from './Status';

type Props = {
  label: string;
  display: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  /** ideal band, drawn as a soil-tone band behind the marker */
  target: [number, number];
  status: StatusKind;
  targetLabel: string;
  note?: string;
};

/** Bullet chart: the reading is a marker on a track with its target band shaded. */
export function BulletRow({ label, display, unit, value, min, max, target, status, targetLabel, note }: Props) {
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  const tone = status === 'good' ? 'bg-foreground' : status === 'warn' ? 'bg-warn' : 'bg-bad';
  return (
    <div className="grid grid-cols-[1fr_auto] md:grid-cols-[180px_1fr_150px] items-center gap-x-6 gap-y-2 py-4">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-bold num leading-tight">
          {display}
          {unit && <span className="text-base font-medium text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
      <div className="justify-self-end md:order-3 md:justify-self-start">
        <Status kind={status} />
      </div>
      <div className="col-span-2 md:col-span-1 md:order-2">
        <div
          className="relative h-6"
          role="img"
          aria-label={`${label} ${display}${unit ?? ''}. Target ${targetLabel}.`}
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-muted rounded-sm" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 rounded-sm bg-accent/25 border border-accent/50"
            style={{ left: `${pct(target[0])}%`, width: `${pct(target[1]) - pct(target[0])}%` }}
          />
          <div
            className={cn('absolute top-1/2 -translate-y-1/2 h-6 w-1 -ml-0.5 rounded-sm ring-2 ring-background transition-[left] duration-[600ms] ease-calm', tone)}
            style={{ left: `${pct(value)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground num mt-1">
          <span>{min}</span>
          <span>Target {targetLabel}</span>
          <span>{max}</span>
        </div>
        {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
      </div>
    </div>
  );
}

/** Categorical reading (Low / Medium / High) as three segments, current one filled. */
export function LevelRow({ label, current, levels, status, targetLabel }: { label: string; current: string; levels: string[]; status: StatusKind; targetLabel: string }) {
  const i = levels.indexOf(current);
  return (
    <div className="grid grid-cols-[1fr_auto] md:grid-cols-[180px_1fr_150px] items-center gap-x-6 gap-y-2 py-4">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-bold leading-tight">{current}</p>
      </div>
      <div className="justify-self-end md:order-3 md:justify-self-start"><Status kind={status} /></div>
      <div className="col-span-2 md:col-span-1 md:order-2" role="img" aria-label={`${label} ${current}. Target ${targetLabel}.`}>
        <div className="flex gap-0.5 h-6 items-center">
          {levels.map((l, k) => (
            <div key={l} className={cn('flex-1 h-4 rounded-sm flex items-center justify-center text-[11px] font-semibold',
              k === i ? (status === 'good' ? 'bg-foreground text-background' : status === 'warn' ? 'bg-warn text-background' : 'bg-bad text-background') : 'bg-muted text-muted-foreground')}>
              {l}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">Target {targetLabel}</p>
      </div>
    </div>
  );
}
