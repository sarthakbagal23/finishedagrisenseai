"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { FigureCaption } from '@/components/viz/FigureCaption';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSensors } from '@/context/SensorContext';
import { cn } from '@/lib/utils';

const priceHistory = [
  { day: 'D1', wheat: 2100, rice: 3800, cotton: 6200, maize: 1900 },
  { day: 'D2', wheat: 2150, rice: 3850, cotton: 6300, maize: 1950 },
  { day: 'D3', wheat: 2200, rice: 3900, cotton: 6450, maize: 2000 },
  { day: 'D4', wheat: 2250, rice: 3980, cotton: 6600, maize: 2020 },
  { day: 'D5', wheat: 2280, rice: 3960, cotton: 6700, maize: 2040 },
  { day: 'D6', wheat: 2300, rice: 3950, cotton: 6800, maize: 2050 },
];

const trendingCrops = [
  { name: 'Cotton (Kapus)', trend: '+6.2%', price: '₹6,800', status: 'booming', icon: '' },
  { name: 'Wheat (Gehu)', trend: '+4.2%', price: '₹2,300', status: 'booming', icon: '🌾' },
  { name: 'Mustard (Sarson)', trend: '+3.5%', price: '₹5,400', status: 'booming', icon: '🌼' },
  { name: 'Rice (Dhan)', trend: '-0.8%', price: '₹3,950', status: 'declining', icon: '🍚' },
  { name: 'Tomato', trend: '-12.4%', price: '₹1,200', status: 'declining', icon: '🍅' },
  { name: 'Maize (Makka)', trend: '+1.5%', price: '₹2,050', status: 'stable', icon: '🌽' },
];

const pricesByState: Record<string, any[]> = {
  'Punjab': [
    { name: 'Wheat', current: 2300, prev: 2200, trend: '+4.2%', up: true },
    { name: 'Rice', current: 3950, prev: 3980, trend: '-0.8%', up: false },
    { name: 'Cotton', current: 6800, prev: 6400, trend: '+6.2%', up: true },
    { name: 'Maize', current: 2050, prev: 2020, trend: '+1.5%', up: true },
  ],
  'Uttar Pradesh': [
    { name: 'Wheat', current: 2150, prev: 2070, trend: '+3.8%', up: true },
    { name: 'Rice', current: 3750, prev: 3810, trend: '-1.5%', up: false },
    { name: 'Cotton', current: 6400, prev: 6060, trend: '+5.5%', up: true },
    { name: 'Maize', current: 1900, prev: 1885, trend: '+0.8%', up: true },
  ],
};

// Crop colours follow the entity, fixed order (wheat, cotton, rice, maize: the order that passes the
// dataviz validator in light mode; dark mode fails its lightness band, so it is not claimed).
// They are light on a light surface, so every line is also labelled directly and a table view exists.
const CROPS = [
  { key: 'wheat', name: 'Wheat', color: '#eda100' },
  { key: 'cotton', name: 'Cotton', color: '#e87ba4' },
  { key: 'rice', name: 'Rice', color: '#1baf7a' },
  { key: 'maize', name: 'Maize', color: '#eb6834' },
] as const;

const indexed = priceHistory.map(r => {
  const base = priceHistory[0] as any;
  const out: any = { day: r.day };
  CROPS.forEach(c => { out[c.key] = +(((r as any)[c.key] / base[c.key]) * 100).toFixed(1); out[c.key + 'Rs'] = (r as any)[c.key]; });
  return out;
});

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="text-xs text-muted-foreground mb-1">{label} · sample</p>
      {CROPS.map(c => (
        <p key={c.key} className="flex items-center gap-2 num">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} aria-hidden />
          <span className="w-14">{c.name}</span>
          <span className="font-semibold">{row[c.key]}</span>
          <span className="text-muted-foreground">₹{row[c.key + 'Rs']}</span>
        </p>
      ))}
    </div>
  );
}

const trendKind = (s: string) => s === 'booming' ? { Icon: TrendingUp, word: 'Rising', tone: 'text-good' } : s === 'declining' ? { Icon: TrendingDown, word: 'Falling', tone: 'text-bad' } : { Icon: Minus, word: 'Steady', tone: 'text-muted-foreground' };

export default function MarketPrices() {
  const { settings, t } = useSensors();
  const [table, setTable] = useState(false);
  const state = settings.location.split(', ')[1] || 'Punjab';
  const currentPrices = pricesByState[state] || pricesByState['Punjab'];
  const rising = trendingCrops.filter(c => c.status === 'booming').length;
  const falling = trendingCrops.filter(c => c.status === 'declining').length;
  const last = indexed.length - 1;

  const tab = "min-h-11 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground font-semibold text-sm";

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-display text-2xl md:text-3xl font-bold">{t('prices_title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {rising} crops rising and {falling} falling in the sample set. These are example prices, not live mandi rates.
        </p>
      </header>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="bg-transparent p-0 h-auto w-full justify-start gap-6 border-b border-border rounded-none">
          <TabsTrigger value="trends" className={tab}>{t('prices_tab_trends')}</TabsTrigger>
          <TabsTrigger value="prices" className={tab}>{t('prices_tab_local')}</TabsTrigger>
          <TabsTrigger value="profit" className={tab}>{t('prices_tab_profit')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-10 mt-8">
          <section>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <FigureCaption
                title="Prices since day 1, indexed to 100"
                source="Sample prices (₹ per quintal), six days."
                caveat="Indexed so crops with different price levels share one axis."
              />
              <button onClick={() => setTable(v => !v)} className="min-h-11 text-sm font-semibold underline underline-offset-4">
                {table ? 'Show chart' : 'Show table'}
              </button>
            </div>
            {!table ? (
              <>
                <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-2" aria-label="Legend">
                  {CROPS.map(c => (
                    <li key={c.key} className="inline-flex items-center gap-2">
                      <span className="w-6 h-0.5 rounded" style={{ background: c.color, height: 3 }} aria-hidden />{c.name}
                    </li>
                  ))}
                </ul>
                <div className="h-[260px] md:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={indexed} margin={{ top: 8, right: 118, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis domain={[96, 112]} tickLine={false} axisLine={false} width={36} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip content={<Tip />} cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }} />
                      {CROPS.map(c => (
                        <Line key={c.key} type="linear" dataKey={c.key} stroke={c.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                          dot={false} activeDot={{ r: 5, fill: c.color, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                          animationDuration={600} animationEasing="ease-out"
                          label={(p: any) => p.index === last
                            ? <text key={c.key} x={p.x + 8} y={p.y} dy={c.key === 'wheat' ? 12 : c.key === 'cotton' ? -2 : 4} fontSize={12} fontWeight={600} fill="hsl(var(--foreground))">{c.name} {p.value}</text>
                            : <g key={p.index} />} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm num">
                  <thead><tr className="border-b border-foreground text-left">
                    <th className="py-2 font-semibold">Day</th>
                    {CROPS.map(c => <th key={c.key} className="py-2 text-right font-semibold">{c.name} ₹</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {priceHistory.map(r => (
                      <tr key={r.day}><td className="py-2.5">{r.day}</td>{CROPS.map(c => <td key={c.key} className="py-2.5 text-right">{(r as any)[c.key].toLocaleString()}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3 className="font-display text-lg font-bold border-b border-foreground pb-2">{t('prices_movers')}</h3>
            <ul className="divide-y divide-border">
              {trendingCrops.map(crop => {
                const k = trendKind(crop.status);
                return (
                  <li key={crop.name} className="flex items-center justify-between gap-4 min-h-[56px] py-2">
                    <div>
                      <p className="text-[15px] font-semibold">{crop.name}</p>
                      <p className="text-sm text-muted-foreground num">{crop.price} per quintal</p>
                    </div>
                    <span className={cn('inline-flex items-center gap-1.5 text-sm font-semibold num', k.tone)}>
                      <k.Icon className="w-4 h-4" aria-hidden />{k.word} {crop.trend}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </TabsContent>

        <TabsContent value="prices" className="mt-8">
          <FigureCaption title={`${t('prices_mandi_prices')}: ${settings.location}`} source="Sample prices (₹ per quintal)." caveat="Not a live mandi feed." />
          <table className="w-full text-sm num">
            <thead><tr className="border-b border-foreground text-left">
              <th className="py-2 font-semibold">Crop</th>
              <th className="py-2 text-right font-semibold">Previous</th>
              <th className="py-2 text-right font-semibold">Now</th>
              <th className="py-2 text-right font-semibold">Change</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {currentPrices.map((crop: any) => (
                <tr key={crop.name}>
                  <td className="py-3 font-semibold">{crop.name}</td>
                  <td className="py-3 text-right text-muted-foreground">₹{crop.prev.toLocaleString()}</td>
                  <td className="py-3 text-right font-semibold">₹{crop.current.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className={cn('inline-flex items-center gap-1 font-semibold', crop.up ? 'text-good' : 'text-bad')}>
                      {crop.up ? <TrendingUp className="w-4 h-4" aria-hidden /> : <TrendingDown className="w-4 h-4" aria-hidden />}{crop.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="profit" className="mt-8 space-y-8 max-w-2xl">
          <div>
            <h3 className="font-display text-lg font-bold">{t('prices_ai_calc')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('prices_reco_desc')}</p>
            <Button className="mt-4 min-h-11 px-6 font-semibold">{t('prices_gen_report')}</Button>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold border-b border-foreground pb-2">{t('prices_best_opp')}</h3>
            <div className="divide-y divide-border">
              <div className="py-4">
                <h4 className="text-[15px] font-semibold">{t('prices_maize_switch' as any)}</h4>
                <p className="text-sm text-muted-foreground mt-1">{t('prices_maize_desc' as any)}</p>
                <p className="text-sm font-semibold mt-2 num">{t('prices_profit_acre' as any)}</p>
              </div>
              <div className="py-4">
                <h4 className="text-[15px] font-semibold">{t('prices_cotton_hold' as any)}</h4>
                <p className="text-sm text-muted-foreground mt-1">{t('prices_cotton_desc' as any)}</p>
                <p className="text-sm font-semibold mt-2 num">{t('prices_cotton_proj' as any)}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
