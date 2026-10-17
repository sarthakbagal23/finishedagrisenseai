"use client";

import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea, ReferenceLine } from 'recharts';
import { useSensors } from '@/context/SensorContext';
import { FigureCaption } from '@/components/viz/FigureCaption';
import { Status, StatusKind } from '@/components/viz/Status';
import { cn } from '@/lib/utils';

// Static 7-day sample. Not read from a device; labelled as such in the page.
const SAMPLE = [
  { moisture: 62, temp: 22, nutrients: 45 },
  { moisture: 68, temp: 24, nutrients: 50 },
  { moisture: 72, temp: 23, nutrients: 65 },
  { moisture: 65, temp: 21, nutrients: 60 },
  { moisture: 70, temp: 25, nutrients: 70 },
  { moisture: 69, temp: 24, nutrients: 55 },
  { moisture: 67, temp: 23, nutrients: 58 },
];
const buildData = () => {
  const today = new Date();
  return SAMPLE.map((d, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return { ...d, date: `${date.getDate()}/${date.getMonth() + 1}` };
  });
};

type Metric = {
  key: 'moisture' | 'temp' | 'nutrients';
  title: string;
  unit: string;
  domain: [number, number];
  band?: [number, number];
  bandLabel?: string;
  live: string;
  status: StatusKind;
};

function Tip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="text-muted-foreground text-xs">{label} (sample)</p>
      <p className="font-semibold num">{payload[0].value}{unit}</p>
    </div>
  );
}

export default function SensorAnalytics() {
  const { sensors } = useSensors();
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const data = buildData();

  const m = sensors.soilMoisture, tt = sensors.soilTemperature;
  const metrics: Metric[] = [
    { key: 'moisture', title: 'Soil moisture', unit: '%', domain: [50, 90], band: [70, 80], bandLabel: 'Target 70–80%', live: `${m.toFixed(1)}%`,
      status: m >= 70 && m <= 80 ? 'good' : m >= 65 && m <= 85 ? 'warn' : 'bad' },
    { key: 'temp', title: 'Soil temperature', unit: '°C', domain: [16, 32], band: [22, 26], bandLabel: 'Target 22–26°C', live: `${tt.toFixed(1)}°C`,
      status: tt >= 22 && tt <= 26 ? 'good' : tt >= 20 && tt <= 30 ? 'warn' : 'bad' },
    { key: 'nutrients', title: 'Nutrient index', unit: '', domain: [30, 80], live: sensors.nutrientLevel,
      status: sensors.nutrientLevel === 'High' ? 'good' : sensors.nutrientLevel === 'Medium' ? 'warn' : 'bad' },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">Seven days of soil readings</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Lines are a fixed sample week, shaded bands are the target range, and the live value beside each title comes from the simulated feed.
          </p>
        </div>
        <div role="group" aria-label="View" className="inline-flex border border-foreground rounded-md overflow-hidden text-sm font-semibold">
          {(['chart', 'table'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
              className={cn('min-h-11 px-4 capitalize transition-colors duration-100', view === v ? 'bg-foreground text-background' : 'hover:bg-muted')}>
              {v}
            </button>
          ))}
        </div>
      </header>

      {view === 'chart' ? (
        <div className="space-y-12">
          {metrics.map(mt => {
            const avg = data.reduce((s, d) => s + d[mt.key], 0) / data.length;
            return (
              <figure key={mt.key} className="figure-enter">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <FigureCaption title={mt.title} source="Sample week, not device data." caveat={mt.bandLabel ? mt.bandLabel + '.' : 'No numeric target; level comes from the live feed.'} />
                  <div className="text-right mb-3">
                    <p className="text-sm text-muted-foreground">Now (simulated)</p>
                    <p className="num font-display text-2xl font-bold leading-none">{mt.live}</p>
                    <Status kind={mt.status} className="mt-1" />
                  </div>
                </div>
                <div className="h-[200px] md:h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                      {mt.band && <ReferenceArea y1={mt.band[0]} y2={mt.band[1]} fill="hsl(var(--accent))" fillOpacity={0.14} stroke="none" ifOverflow="extendDomain" />}
                      <ReferenceLine y={avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: `avg ${avg.toFixed(1)}${mt.unit}`, position: 'insideTopRight', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis domain={mt.domain} tickLine={false} axisLine={false} width={36} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip content={<Tip unit={mt.unit} />} cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }} />
                      <Line type="linear" dataKey={mt.key} stroke="hsl(var(--accent))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                        dot={{ r: 4, fill: 'hsl(var(--accent))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                        activeDot={{ r: 5, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                        animationDuration={600} animationEasing="ease-out" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </figure>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm num">
            <caption className="text-left text-muted-foreground pb-2">Sample week: not device data.</caption>
            <thead>
              <tr className="border-b border-foreground text-left">
                <th className="py-2 pr-4 font-semibold">Date</th>
                <th className="py-2 pr-4 font-semibold text-right">Moisture %</th>
                <th className="py-2 pr-4 font-semibold text-right">Temp °C</th>
                <th className="py-2 font-semibold text-right">Nutrient index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(d => (
                <tr key={d.date}>
                  <td className="py-2.5 pr-4">{d.date}</td>
                  <td className="py-2.5 pr-4 text-right">{d.moisture}</td>
                  <td className="py-2.5 pr-4 text-right">{d.temp}</td>
                  <td className="py-2.5 text-right">{d.nutrients}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-muted-foreground border-t border-border pt-4 max-w-2xl">
        A sudden drop in moisture or a jump in temperature can point to an irrigation fault or a weather change; compare against the forecast before acting.
      </p>
    </div>
  );
}
