"use client";

import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, ChevronRight } from 'lucide-react';
import { useSensors } from '@/context/SensorContext';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BulletRow, LevelRow } from '@/components/viz/BulletRow';
import type { StatusKind } from '@/components/viz/Status';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Check irrigation valves in sector A', completed: false, date: format(new Date(), 'yyyy-MM-dd') },
  { id: '2', title: 'Run canopy health scan via drone', completed: false, date: format(new Date(), 'yyyy-MM-dd') },
  { id: '3', title: 'Calibrate soil sensors for pH drift', completed: false, date: format(new Date(), 'yyyy-MM-dd') },
];

// Target bands: ideal range, with a wider acceptable range around it.
const band = (v: number, ideal: [number, number], ok: [number, number]): StatusKind =>
  v >= ideal[0] && v <= ideal[1] ? 'good' : v >= ok[0] && v <= ok[1] ? 'warn' : 'bad';

export default function HomeDashboard() {
  const { sensors, lastUpdated, settings, t } = useSensors();
  const [mounted, setMounted] = useState(false);
  const [irrigationOn, setIrrigationOn] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const saved = localStorage.getItem('agrisense_tasks_v4');
    if (saved) {
      try {
        const parsed: Task[] = JSON.parse(saved);
        setTasks(parsed.map(t => ({ ...t, completed: t.date === today ? t.completed : false, date: today })));
      } catch {}
    }
    const valve = localStorage.getItem('agrisense_valve');
    if (valve) setIrrigationOn(valve === 'true');
  }, []);

  const persistTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem('agrisense_tasks_v4', JSON.stringify(updated));
  };
  const toggleTask = (id: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    persistTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed, date: today } : t));
  };
  const deleteTask = (id: string) => persistTasks(tasks.filter(t => t.id !== id));
  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    persistTasks([...tasks, { id: Date.now().toString(), title: newTaskTitle.trim(), completed: false, date: format(new Date(), 'yyyy-MM-dd') }]);
    setNewTaskTitle('');
    setShowInput(false);
  };
  const toggleValve = () => {
    const next = !irrigationOn;
    setIrrigationOn(next);
    localStorage.setItem('agrisense_valve', String(next));
  };

  if (!mounted) return <div className="min-h-[60vh]" aria-busy="true" />;

  const m = sensors.soilMoisture, tmp = sensors.soilTemperature, ph = sensors.soilPh, nut = sensors.nutrientLevel;
  const mStatus = band(m, [70, 80], [65, 85]);
  const tStatus = band(tmp, [22, 26], [20, 30]);
  const pStatus = band(ph, [6.0, 7.0], [5.5, 7.5]);
  const nStatus: StatusKind = nut === 'High' ? 'good' : nut === 'Medium' ? 'warn' : 'bad';

  // Same scoring rules as before; now the penalties are shown, not hidden.
  const penalties: [string, number][] = [];
  if (m < 60 || m > 85) penalties.push([t('dashboard_moisture'), 15]);
  if (tmp < 20 || tmp > 30) penalties.push([t('dashboard_temp'), 10]);
  if (ph < 5.5 || ph > 7.5) penalties.push([t('dashboard_ph'), 15]);
  if (nut === 'Low') penalties.push([t('dashboard_nutrients'), 20]);
  const score = Math.max(0, 100 - penalties.reduce((a, [, n]) => a + n, 0));

  const issues: string[] = [];
  if (mStatus !== 'good') issues.push(`${t('dashboard_moisture').toLowerCase()} is ${m.toFixed(1)}%, ${m < 70 ? 'below' : 'above'} the 70–80% target`);
  if (tStatus !== 'good') issues.push(`${t('dashboard_temp').toLowerCase()} is ${tmp.toFixed(1)}°C, ${tmp < 22 ? 'below' : 'above'} the 22–26°C target`);
  if (pStatus !== 'good') issues.push(`pH is ${ph.toFixed(1)}, ${ph < 6 ? 'below' : 'above'} the 6.0–7.0 target`);
  if (nStatus !== 'good') issues.push(`nutrients are ${nut.toLowerCase()}, target is high`);
  const headline = issues.length === 0
    ? `All four readings are inside their target range for ${settings.cropType || 'your crop'}.`
    : issues.join('; ').replace(/^./, c => c.toUpperCase()) + '.';

  const done = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-12">
      <section aria-labelledby="brief">
        <p className="text-sm text-muted-foreground num">
          {format(new Date(), 'EEEE d MMMM')} · {settings.cropType} · {settings.location.split(',')[0]}
        </p>
        <h2 id="brief" className="font-display text-2xl md:text-4xl font-bold leading-tight mt-2 max-w-3xl text-balance">{headline}</h2>
        <p className="text-sm text-muted-foreground mt-3 num">
          Field score <strong className="text-foreground">{score}/100</strong>
          {penalties.length > 0 && <> (−{penalties.map(([n, p]) => `${p} ${n.toLowerCase()}`).join(', −')})</>}
          {' · '}counts out-of-range readings only, not "Watch"{' · '}updated {format(lastUpdated, 'h:mm:ss a')} · simulated sensors
        </p>
      </section>

      <section aria-labelledby="readings">
        <div className="flex items-baseline justify-between border-b border-foreground pb-2">
          <h3 id="readings" className="font-display text-lg font-bold">Soil readings</h3>
          <Link href="/sensors" className="text-sm underline underline-offset-4 hover:text-muted-foreground">7-day history</Link>
        </div>
        <div className="divide-y divide-border">
          <BulletRow label={t('dashboard_moisture')} display={m.toFixed(1)} unit="%" value={m} min={40} max={100} target={[70, 80]} targetLabel="70–80%" status={mStatus} />
          <BulletRow label={t('dashboard_temp')} display={tmp.toFixed(1)} unit="°C" value={tmp} min={10} max={40} target={[22, 26]} targetLabel="22–26°C" status={tStatus} />
          <BulletRow label={t('dashboard_ph')} display={ph.toFixed(1)} value={ph} min={4} max={9} target={[6, 7]} targetLabel="6.0–7.0" status={pStatus} />
          <LevelRow label={t('dashboard_nutrients')} current={nut} levels={['Low', 'Medium', 'High']} status={nStatus} targetLabel="High" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <section className="lg:col-span-3" aria-labelledby="tasks">
          <div className="flex items-baseline justify-between border-b border-foreground pb-2">
            <h3 id="tasks" className="font-display text-lg font-bold">Today&apos;s tasks</h3>
            <span className="text-sm text-muted-foreground num">{done} of {tasks.length} done</span>
          </div>
          <ul className="divide-y divide-border">
            {tasks.map(task => (
              <li key={task.id} className="flex items-center group">
                <button
                  onClick={() => toggleTask(task.id)}
                  aria-pressed={task.completed}
                  className="flex-1 flex items-center gap-3 min-h-[52px] text-left"
                >
                  <span className={cn('w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors duration-100',
                    task.completed ? 'bg-foreground border-foreground' : 'border-muted-foreground')}>
                    {task.completed && <Check className="w-3.5 h-3.5 text-background" strokeWidth={3} aria-hidden />}
                  </span>
                  <span className={cn('text-[15px]', task.completed && 'text-muted-foreground line-through')}>{task.title}</span>
                </button>
                <button onClick={() => deleteTask(task.id)} aria-label={`Delete task: ${task.title}`}
                  className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-bad transition-colors duration-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          {tasks.length === 0 && <p className="py-8 text-sm text-muted-foreground">No tasks for today.</p>}
          {showInput ? (
            <div className="flex gap-2 pt-3">
              <input
                autoFocus
                aria-label="New task"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setShowInput(false); }}
                placeholder="What needs doing?"
                className="flex-1 min-h-11 bg-card border border-border rounded-md px-3 text-[15px] placeholder:text-muted-foreground"
              />
              <button onClick={addTask} className="min-h-11 px-5 bg-primary text-primary-foreground rounded-md text-sm font-semibold">Add</button>
            </div>
          ) : (
            <button onClick={() => setShowInput(true)} className="mt-3 inline-flex items-center gap-2 min-h-11 text-sm font-semibold underline underline-offset-4">
              <Plus className="w-4 h-4" aria-hidden /> Add task
            </button>
          )}
        </section>

        <section className="lg:col-span-2" aria-labelledby="actions">
          <div className="border-b border-foreground pb-2">
            <h3 id="actions" className="font-display text-lg font-bold">Field controls</h3>
          </div>
          <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
            <div>
              <p className="text-[15px] font-semibold" id="valve-label">{t('dashboard_smart_valve')}</p>
              <p className="text-sm text-muted-foreground">{irrigationOn ? 'On: irrigation running' : 'Off'}</p>
            </div>
            <button
              role="switch"
              aria-checked={irrigationOn}
              aria-labelledby="valve-label"
              onClick={toggleValve}
              className={cn('relative w-14 h-8 rounded-full border-2 border-foreground transition-colors duration-150 shrink-0', irrigationOn ? 'bg-foreground' : 'bg-transparent')}
            >
              <span className={cn('absolute top-0.5 left-0.5 w-6 h-6 rounded-full transition-transform duration-150 ease-calm', irrigationOn ? 'translate-x-6 bg-background' : 'bg-foreground')} />
            </button>
          </div>
          {[
            { href: '/diagnosis', title: t('dashboard_disease_scan'), sub: 'Photograph a leaf for an AI diagnosis' },
            { href: '/weather', title: 'Weather forecast', sub: 'Live forecast for your location' },
            { href: '/prices', title: 'Market prices', sub: 'Sample mandi prices' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="flex items-center justify-between gap-4 min-h-[64px] py-3 border-b border-border group">
              <span>
                <span className="block text-[15px] font-semibold">{l.title}</span>
                <span className="block text-sm text-muted-foreground">{l.sub}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-100 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
