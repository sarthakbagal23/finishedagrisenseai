"use client";

import { ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis } from "recharts";
import Link from "next/link";
import data from "@/data/dataset-site.json";
import { FigureCaption } from "@/components/viz/FigureCaption";

const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 12 };
const BLUE = "hsl(var(--model))";
const points = data.points.map(([x, y, h]) => ({ x, y, h }));

function Frame({ n, title, source, children, finding, suggests, verify }: {
  n: number; title: string; source: string; children: React.ReactNode; finding: string; suggests: string; verify: string;
}) {
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] border-t border-foreground pt-4">
      <figure className="min-w-0">
        <FigureCaption title={`Figure ${n}. ${title}`} source={source} />
        {children}
      </figure>
      <dl className="space-y-4 text-[15px] lg:pt-12">
        {[["Simulated finding", finding], ["What it might suggest", suggests], ["What we still need to verify", verify]].map(([k, v]) => (
          <div key={k}><dt className="font-semibold">{k}</dt><dd className="text-muted-foreground mt-0.5">{v}</dd></div>
        ))}
      </dl>
    </section>
  );
}

const ScatterTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm num shadow-sm">
      <p className="text-xs text-muted-foreground">Synthetic trial</p>
      <p>Rigidity <strong>{p.x}</strong> kPa</p><p>Root <strong>{p.y}</strong> mm/day</p><p>Hydrogel <strong>{p.h}</strong>%</p>
    </div>
  );
};

const TierTip = ({ active, payload, unit }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm num shadow-sm">
      <p className="text-xs text-muted-foreground">Hydrogel {p.hydrogel}% · n = {p.n}</p>
      <p>Mean <strong>{unit === "mm/day" ? p.root : p.gene}</strong> {unit}</p>
      <p className="text-xs text-muted-foreground">SD {unit === "mm/day" ? p.root_sd : p.gene_sd}</p>
    </div>
  );
};

function TierChart({ k, title, unit, domain }: { k: "root" | "gene"; title: string; unit: string; domain: [number, number] }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold mb-1">{title}</p>
      <div className="h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.tiers} margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="hydrogel" type="number" domain={[0, 2]} ticks={[0, 0.5, 1, 1.5, 2]} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} tick={tick}
              label={{ value: "Hydrogel (%)", position: "insideBottom", offset: -12, fill: "hsl(var(--foreground))", fontSize: 12 }} />
            <YAxis domain={domain} tickLine={false} axisLine={false} width={34} tick={tick} />
            <Tooltip content={<TierTip unit={unit} />} cursor={{ stroke: "hsl(var(--foreground))" }} />
            <Line type="linear" dataKey={k} stroke={BLUE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
              dot={{ r: 5, fill: BLUE, stroke: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 6, stroke: "hsl(var(--background))", strokeWidth: 2 }}
              animationDuration={600} animationEasing="ease-out" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">{unit}, mean per hydrogel tier</p>
    </div>
  );
}

export default function Findings() {
  const bandMax = 14;
  return (
    <div className="space-y-14 pb-8">
      <header className="max-w-3xl">
        <h2 className="font-display text-3xl md:text-5xl font-bold text-balance">What the data shows</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Three figures. Each pattern below is <strong className="text-foreground">in the synthetic dataset</strong>, and the generator was written to produce it, so these figures show the dataset behaves as designed. They are not evidence about real roots.
        </p>
      </header>

      <Frame n={1} title="Harder soil, slower roots" source="All 1,000 synthetic trials. Pearson r = −0.76 between rigidity and root elongation."
        finding="Root elongation falls from about 14 mm/day on soft soil to about 3 mm/day at 70 kPa."
        suggests="If real soil behaves this way, compaction could be worth measuring first when roots struggle in dry fields."
        verify="Real rigidity readings from a penetrometer, real root growth, and soil types the generator does not model.">
        <div className="h-[300px] md:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis type="number" dataKey="x" name="Rigidity" domain={[0, 70]} ticks={[0, 10, 20, 30, 40, 50, 60, 70]} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} tick={tick}
                label={{ value: "Soil rigidity (kPa)", position: "insideBottom", offset: -14, fill: "hsl(var(--foreground))", fontSize: 12 }} />
              <YAxis type="number" dataKey="y" name="Root" domain={[0, 14]} ticks={[0, 2, 4, 6, 8, 10, 12, 14]} tickLine={false} axisLine={false} width={34} tick={tick} />
              <ZAxis range={[26, 26]} />
              <Tooltip content={<ScatterTip />} cursor={{ stroke: "hsl(var(--foreground))", strokeDasharray: "3 3" }} />
              <Scatter data={points} fill={BLUE} fillOpacity={0.4} isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">Root elongation (mm/day) against rigidity. The table view is the downloadable CSV: <a className="underline underline-offset-2" href="/data/agrisense_synthetic_trials.csv" download>all 1,000 rows</a>.</p>
      </Frame>

      <Frame n={2} title="More hydrogel, longer roots and a lower stress proxy" source="Mean by hydrogel tier, 8 tiers, 79 to 157 trials each. Same blue because both are generated quantities."
        finding="Mean root elongation rises from 7.05 to 10.69 mm/day across tiers, while the EXPA1-like proxy falls from 2.80 to 1.48."
        suggests="Only that the generator encodes a buffering effect. We cannot say hydrogel does this in soil."
        verify="A controlled experiment with real hydrogel doses, replicates and a measured expansin assay. There is no optimal dose here.">
        <div className="grid gap-6 sm:grid-cols-2">
          <TierChart k="root" title="Root elongation" unit="mm/day" domain={[6, 12]} />
          <TierChart k="gene" title="EXPA1-like proxy (simulated)" unit="fold-change units" domain={[1, 3]} />
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer min-h-11 flex items-center text-sm font-semibold underline underline-offset-4">Show the numbers</summary>
          <div className="overflow-x-auto">
            <table className="w-full text-sm num min-w-[480px]">
              <thead><tr className="text-left border-b border-foreground"><th className="py-2 font-semibold">Hydrogel %</th><th className="py-2 text-right font-semibold">Trials</th><th className="py-2 text-right font-semibold">Mean root</th><th className="py-2 text-right font-semibold">SD</th><th className="py-2 text-right font-semibold">Mean proxy</th><th className="py-2 text-right font-semibold">SD</th></tr></thead>
              <tbody className="divide-y divide-border">
                {data.tiers.map((t) => <tr key={t.hydrogel}><td className="py-2">{t.hydrogel}</td><td className="py-2 text-right">{t.n}</td><td className="py-2 text-right">{t.root}</td><td className="py-2 text-right">{t.root_sd}</td><td className="py-2 text-right">{t.gene}</td><td className="py-2 text-right">{t.gene_sd}</td></tr>)}
              </tbody>
            </table>
          </div>
        </details>
      </Frame>

      <Frame n={3} title="Wetter scenarios, longer roots, and a tighter link to rigidity" source="Trials grouped into five rainfall bands. Bands are not equal in size, so n is shown."
        finding="Mean root elongation climbs from 7.3 to 11.3 mm/day as rainfall rises, and the rigidity-root correlation strengthens from −0.52 to −0.72."
        suggests="In this scenario, soil strength matters more to root growth when water is not the limiting factor."
        verify="Rainfall here is a generated scenario, not Indian weather. Rainfall and rigidity are also correlated in the generator, so their effects are tangled.">
        <ul className="divide-y divide-border border-y border-border" aria-label="Rainfall bands">
          {data.bands.map((b) => (
            <li key={b.band} className="py-3">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-semibold">{b.band} mm/day <span className="font-normal text-muted-foreground num">(n = {b.n})</span></span>
                <span className="num">mean root <strong>{b.root}</strong> mm/day · r = <strong>{b.r.toString().replace("-", "−")}</strong></span>
              </div>
              <div className="mt-2 h-2 rounded-sm bg-muted" role="img" aria-label={`Mean root elongation ${b.root} of ${bandMax} millimetres per day`}>
                <div className="h-full rounded-sm bg-model transition-[width] duration-[600ms] ease-calm" style={{ width: `${(b.root / bandMax) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-2">Bar length is mean root elongation out of 14 mm/day, the top of the generator&apos;s range.</p>
      </Frame>

      <section className="border-l-2 border-warn pl-5 max-w-3xl">
        <h3 className="font-display text-xl font-bold">Read these as a design check, not a discovery</h3>
        <p className="mt-2 text-[15px] text-muted-foreground">The relationships were programmed in, so finding them confirms the dataset matches its specification. Model scores on this data measure how well a model recovers the formulas. The <Link href="/research" className="underline underline-offset-4 font-semibold">Research Lab</Link> shows that work as a secondary demonstration.</p>
      </section>
    </div>
  );
}
