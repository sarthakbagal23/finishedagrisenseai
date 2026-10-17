"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, FlaskConical } from "lucide-react";
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { FigureCaption } from "@/components/viz/FigureCaption";
import {
  CORRELATIONS, DATASET_AUDIT, EXTRAPOLATION_STRESS_TEST, INTERVAL_CALIBRATION,
  MODEL_METRICS, OBSERVED_RANGES, PERMUTATION_IMPORTANCE, RESIDUAL_STANDARD_DEVIATIONS, SENSITIVITY,
  predictSyntheticScenario,
} from "@/data/agrisense-research";

type View = "overview" | "scenario" | "validation";
type ResearchTarget = "root" | "gene";
type XVar = "rigidity" | "hydrogel" | "rainfall";

const fmt = (n: number, d = 2) => n.toFixed(d);
const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 12 };

const X_CFG: Record<XVar, { label: string; min: number; max: number; step: number; unit: string }> = {
  rigidity: { label: "Soil rigidity", min: 5, max: 100, step: 1, unit: "kPa" },
  hydrogel: { label: "Hydrogel concentration", min: 0, max: 2, step: 0.25, unit: "%" },
  rainfall: { label: "Average daily rainfall", min: 0, max: 12, step: 0.25, unit: "mm/day" },
};

function Section({ phase, title, children }: { phase?: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-foreground pt-3">
      <h3 className="font-display text-xl font-bold">
        {phase && <span className="text-muted-foreground font-medium text-base mr-2">{phase}</span>}
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function RangeControl({ k, value, onChange }: { k: XVar; value: number; onChange: (v: number) => void }) {
  const c = X_CFG[k];
  const o = OBSERVED_RANGES[k];
  const outside = value < o.min || value > o.max;
  const id = `rc-${k}`;
  return (
    <div className="py-4 border-b border-border">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[15px] font-semibold">{c.label}</label>
        <span className="num font-display text-xl font-bold">{fmt(value, c.step < 1 ? 2 : 0)}<span className="text-sm font-medium text-muted-foreground ml-1">{c.unit}</span></span>
      </div>
      <input id={id} type="range" min={c.min} max={c.max} step={c.step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full h-11 cursor-pointer accent-[hsl(var(--model))]" />
      <div className={cn("flex items-start gap-1.5 text-sm", outside ? "text-warn font-semibold" : "text-muted-foreground")}>
        {outside ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />}
        <span className="num">{outside ? "Extrapolation: " : "Inside "}training range {o.min}–{o.max} {c.unit}</span>
      </div>
    </div>
  );
}

/** Horizontal bar row made from HTML: value, bar, and the number as text. */
function BarRow({ label, value, max, text, tone = "ink", note }: { label: string; value: number; max: number; text: string; tone?: "ink" | "model" | "soil" | "warn"; note?: string }) {
  const bg = tone === "model" ? "bg-model" : tone === "soil" ? "bg-accent" : tone === "warn" ? "bg-warn" : "bg-foreground";
  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="num font-semibold">{text}</span>
      </div>
      <div className="mt-1.5 h-2 bg-muted rounded-sm"><div className={cn("h-full rounded-sm", bg)} style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }} /></div>
      {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}

/** Dot plot of mean CV R² with ±SD whiskers. Position carries the value; the table is below. */
function R2DotPlot({ rows, bestModel }: { rows: typeof MODEL_METRICS; bestModel: string }) {
  const lo = -0.05, hi = 1;
  const p = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;
  return (
    <div role="img" aria-label="Mean cross-validated R squared by model with standard deviation whiskers">
      {rows.map((m) => (
        <div key={m.model} className="grid grid-cols-[110px_1fr] sm:grid-cols-[170px_1fr] items-center gap-3 py-2.5 border-b border-border last:border-0">
          <span className="text-sm font-semibold leading-tight">{m.model}</span>
          <div className="relative h-6">
            <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
            {[0, 0.25, 0.5, 0.75, 1].map((t) => <div key={t} className="absolute top-0 bottom-0 w-px bg-border/60" style={{ left: p(t) }} />)}
            <div className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-foreground/70" style={{ left: p(m.r2 - m.r2Sd), width: `calc(${p(m.r2 + m.r2Sd)} - ${p(m.r2 - m.r2Sd)})` }} />
            <div className={cn("absolute top-1/2 w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full ring-2 ring-background", m.model === bestModel ? "bg-model" : "bg-foreground")} style={{ left: p(m.r2) }} />
          </div>
        </div>
      ))}
      <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[170px_1fr] gap-3">
        <span />
        <div className="relative h-5 text-xs text-muted-foreground num">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => <span key={t} className="absolute -translate-x-1/2" style={{ left: p(t) }}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}

function LabTip({ active, payload, unit, xUnit }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm num">
      <p className="text-xs text-muted-foreground">{fmt(d.x, 2)} {xUnit}</p>
      <p className="font-semibold">{fmt(d.root)} {unit}</p>
      <p className="text-xs text-muted-foreground">90% band {fmt(d.band[0])}–{fmt(d.band[1])}</p>
    </div>
  );
}

export default function ResearchLabPage() {
  const [view, setView] = useState<View>("scenario");
  const [target, setTarget] = useState<ResearchTarget>("root");
  const [xVar, setXVar] = useState<XVar>("rigidity");
  const [rigidity, setRigidity] = useState(55);
  const [hydrogel, setHydrogel] = useState(1);
  const [rainfall, setRainfall] = useState(3);
  const [showBaseline, setShowBaseline] = useState(true);

  const scenario = { rigidity, hydrogel, rainfall };
  const prediction = useMemo(() => predictSyntheticScenario(scenario), [rigidity, hydrogel, rainfall]); // eslint-disable-line react-hooks/exhaustive-deps
  const hw = INTERVAL_CALIBRATION.halfWidth;
  const curve = useMemo(() => {
    const c = X_CFG[xVar];
    const n = 60;
    return Array.from({ length: n + 1 }, (_, i) => {
      const x = c.min + ((c.max - c.min) * i) / n;
      const root = predictSyntheticScenario({ rigidity, hydrogel, rainfall, [xVar]: x }).root;
      return { x, root, band: [Math.max(0, root - hw), root + hw] as [number, number] };
    });
  }, [xVar, rigidity, hydrogel, rainfall, hw]);
  const doseResponse = useMemo(() => Array.from({ length: 9 }, (_, i) => {
    const dose = i * 0.25;
    return {
      dose,
      harsh: predictSyntheticScenario({ rigidity: 60, hydrogel: dose, rainfall: 2 }).root,
      moderate: predictSyntheticScenario({ rigidity: 40, hydrogel: dose, rainfall: 4 }).root,
      mild: predictSyntheticScenario({ rigidity: 25, hydrogel: dose, rainfall: 7 }).root,
    };
  }), []);

  const currentMetrics = MODEL_METRICS.filter((m) => m.target === target);
  const visibleMetrics = showBaseline ? currentMetrics : currentMetrics.filter((m) => m.model !== "Mean baseline");
  const selectedMetric = currentMetrics.reduce((best, m) => (m.rmse < best.rmse ? m : best), currentMetrics[0]);
  const targetLabel = target === "root" ? "Root elongation rate" : "EXPA1-like proxy";
  const xc = X_CFG[xVar];
  const xObs = OBSERVED_RANGES[xVar];
  const xValue = scenario[xVar];

  const downloadMetrics = () => {
    const rows = [
      ["Target", "Model", "CV R2 mean", "CV R2 SD", "CV MAE", "CV MAE SD", "CV RMSE", "CV RMSE SD"],
      ...MODEL_METRICS.map((m) => [m.target, m.model, m.r2, m.r2Sd, m.mae, m.maeSd, m.rmse, m.rmseSd]),
    ];
    const csv = rows.map((row) => row.map((cell) => {
      const value = String(cell);
      return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
    }).join(",")).join(String.fromCharCode(10));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "agrisense_synthetic_model_comparison.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs: [View, string][] = [["scenario", "Scenario lab"], ["overview", "Data and relationships"], ["validation", "Model validation"]];

  return (
    <div className="space-y-10 pb-8">
      <header>
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-model-ink"><FlaskConical className="w-4 h-4" aria-hidden /> Research Lab · synthetic data</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 max-w-3xl text-balance">From soil stress to root response.</h2>
        <p className="mt-3 max-w-2xl text-[15px] text-muted-foreground">
          Drought-hardening scenario: soil rigidity, hydrogel concentration and rainfall against simulated root elongation and an EXPA1-like response proxy.
        </p>
        <p className="mt-4 max-w-2xl border-l-2 border-warn pl-3 text-sm">
          <strong>All 1,000 rows are formula-generated.</strong> The proxy is not measured EXPA1 expression, and model scores do not establish real biological effects or farm treatment advice.
        </p>
      </header>

      <nav aria-label="Research sections" className="flex gap-6 border-b border-border overflow-x-auto">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} aria-current={view === key ? "page" : undefined}
            className={cn("min-h-11 whitespace-nowrap border-b-2 text-sm font-semibold transition-colors duration-100", view === key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {label}
          </button>
        ))}
      </nav>

      {view === "scenario" && (
        <div className="space-y-10">
          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,340px)_1fr]">
            <div>
              <h3 className="font-display text-lg font-bold border-b border-foreground pb-2">Soil-stress scenario</h3>
              <RangeControl k="rigidity" value={rigidity} onChange={setRigidity} />
              <RangeControl k="hydrogel" value={hydrogel} onChange={setHydrogel} />
              <RangeControl k="rainfall" value={rainfall} onChange={setRainfall} />
              <div className="flex flex-wrap gap-2 pt-4">
                {[
                  ["Harsh", 60, 0, 2], ["Moderate", 40, 1, 4], ["Mild", 25, 1.5, 7],
                ].map(([l, r, h, f]) => (
                  <button key={l as string} onClick={() => { setRigidity(r as number); setHydrogel(h as number); setRainfall(f as number); }}
                    className="min-h-11 px-3 border border-border rounded-md text-sm font-semibold hover:border-foreground transition-colors duration-100">{l} reference</button>
                ))}
                <button onClick={() => { setRigidity(55); setHydrogel(1); setRainfall(3); }} className="min-h-11 px-3 text-sm font-semibold underline underline-offset-4">Reset</button>
              </div>
            </div>

            <div className="min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-model" aria-hidden />Predicted root elongation</p>
                  <p className="font-display text-5xl font-bold num leading-none mt-1">{fmt(prediction.root)}<span className="text-base font-medium text-muted-foreground ml-1.5">mm/day</span></p>
                  <p className="text-xs text-muted-foreground mt-1 num">Raw model {fmt(prediction.rootRaw, 3)}{prediction.rootWasBounded && ", constrained to the generated target range for display"}</p>
                </div>
                <div>
                  <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-model" aria-hidden />EXPA1-like response proxy</p>
                  <p className="font-display text-5xl font-bold num leading-none mt-1">{fmt(prediction.geneProxy, 3)}</p>
                  <p className="text-xs text-muted-foreground mt-1 num">Simulated fold-change units · raw {fmt(prediction.geneRaw, 4)} · band <strong className="text-foreground">{prediction.warningBand}</strong>{prediction.geneWasBounded && " · constrained for display"}</p>
                </div>
              </div>

              <div className={cn("mt-5 flex items-start gap-2 text-sm", prediction.inObservedTrainingRange ? "text-good" : "text-warn")} role="status">
                {prediction.inObservedTrainingRange ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />}
                <p className="text-foreground">
                  <strong>{prediction.inObservedTrainingRange ? "Inside observed feature ranges." : "Extrapolation warning."}</strong>{" "}
                  {prediction.inObservedTrainingRange
                    ? "Not evidence the scenario is biologically validated."
                    : `Outside observed range for: ${prediction.outOfRangeFeatures.join(", ")}. The model may be unreliable even if the slider allows it.`}
                </p>
              </div>

              <figure className="mt-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <FigureCaption
                    title={`Root elongation as ${xc.label.toLowerCase()} changes`}
                    source="Degree-2 interaction model on synthetic data; other inputs held at the sliders."
                    caveat={`Band is a 90% interval (±${fmt(hw)} mm/day; ${(INTERVAL_CALIBRATION.empiricalCoverage * 100).toFixed(1)}% empirical coverage on ${INTERVAL_CALIBRATION.testRows} synthetic test rows).`}
                  />
                  <div role="group" aria-label="Horizontal axis" className="inline-flex border border-foreground rounded-md overflow-hidden text-sm font-semibold">
                    {(Object.keys(X_CFG) as XVar[]).map((k) => (
                      <button key={k} onClick={() => setXVar(k)} aria-pressed={xVar === k}
                        className={cn("min-h-11 px-3 capitalize transition-colors duration-100", xVar === k ? "bg-foreground text-background" : "hover:bg-muted")}>{k}</button>
                    ))}
                  </div>
                </div>
                <div className="h-[280px] md:h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={curve} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" dataKey="x" domain={[xc.min, xc.max]} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} tick={axisTick}
                        label={{ value: `${xc.label} (${xc.unit})`, position: "insideBottom", offset: -4, fill: "hsl(var(--muted-foreground))", fontSize: 12 }} height={44} />
                      <YAxis domain={[0, 14]} ticks={[0, 2, 4, 6, 8, 10, 12, 14]} tickLine={false} axisLine={false} width={36} tick={axisTick} />
                      {xObs.max < xc.max && (
                        <ReferenceArea x1={xObs.max} x2={xc.max} fill="hsl(var(--muted-foreground))" fillOpacity={0.14} stroke="none"
                          label={{ value: "Outside training data", position: "insideTop", fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }} />
                      )}
                      <Tooltip content={<LabTip unit="mm/day" xUnit={xc.unit} />} cursor={{ stroke: "hsl(var(--foreground))", strokeWidth: 1 }} />
                      <Area type="linear" dataKey="band" stroke="none" fill="hsl(var(--model))" fillOpacity={0.18} isAnimationActive={false} />
                      <Line type="linear" dataKey="root" stroke="hsl(var(--model))" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" dot={false} animationDuration={280} animationEasing="ease-out" />
                      <ReferenceLine x={xValue} stroke="hsl(var(--foreground))" strokeDasharray="3 3" />
                      <ReferenceDot x={xValue} y={prediction.root} r={6} fill="hsl(var(--model))" stroke="hsl(var(--background))" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Solid line: model prediction. Shaded ribbon: 90% interval. Dot: your current scenario. Grey region: values the model never saw during fitting.</p>
              </figure>
            </div>
          </div>

          <Section title="How to read this">
            <ol className="grid gap-6 md:grid-cols-3 text-sm">
              {[
                ["1", "Change one factor", "Compare one variable at a time to see how the synthetic model responds."],
                ["2", "Watch the grey region", "A value can be inside the slider limits but outside the data used to fit the model."],
                ["3", "Do not infer causality", "The targets are generated by code; the model learns programmed patterns, not a proven treatment effect."],
              ].map(([n, t, b]) => <li key={n}><p className="font-semibold"><span className="num text-muted-foreground mr-2">{n}</span>{t}</p><p className="text-muted-foreground mt-1">{b}</p></li>)}
            </ol>
          </Section>
        </div>
      )}

      {view === "overview" && (
        <div className="space-y-12">
          <Section phase="Phase 1" title="A clean starting dataset">
            <p className="text-sm text-muted-foreground max-w-2xl">Quality-control checks from the generated source file. Outlier flags are kept for review, not deleted.</p>
            <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
              {[
                ["Synthetic rows", DATASET_AUDIT.rowsCleaned.toLocaleString(), "Original and cleaned files match."],
                ["Missing values", String(DATASET_AUDIT.missingValues), "Across six required columns."],
                ["Rows removed", String(DATASET_AUDIT.rowsRemoved), "No integrity-rule removals needed."],
                ["IQR flag entries", String(DATASET_AUDIT.featureLevelOutlierFlags), "Across features; some may share a row."],
              ].map(([l, v, n]) => (
                <div key={l}>
                  <dt className="text-sm text-muted-foreground">{l}</dt>
                  <dd className="font-display text-3xl font-bold num">{v}</dd>
                  <dd className="text-xs text-muted-foreground mt-0.5">{n}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section phase="Phase 2" title="What the synthetic data encodes">
            <FigureCaption title="Pearson correlation between pairs" source="Source: correlation_matrix.csv, 1,000 synthetic rows." caveat="Association only. Rainfall and rigidity are correlated in the generator, so these are not independent causal effects." />
            <div role="img" aria-label="Pearson correlations, bars extend left for negative and right for positive">
              {CORRELATIONS.map((c) => (
                <div key={c.pair} className="grid grid-cols-[1fr_auto] md:grid-cols-[230px_1fr_56px] items-center gap-x-4 gap-y-1 py-2.5 border-b border-border last:border-0">
                  <span className="text-sm font-semibold">{c.pair}</span>
                  <span className="num text-sm font-semibold md:order-3 text-right">{c.r > 0 ? "+" : "−"}{Math.abs(c.r).toFixed(2)}</span>
                  <div className="relative h-4 col-span-2 md:col-span-1 md:order-2">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground" />
                    <div className="absolute top-0.5 bottom-0.5 rounded-sm bg-accent" style={c.r >= 0 ? { left: "50%", width: `${c.r * 50}%` } : { right: "50%", width: `${-c.r * 50}%` }} />
                  </div>
                </div>
              ))}
              <div className="hidden md:grid grid-cols-[230px_1fr_56px] gap-x-4 text-xs text-muted-foreground num"><span /><div className="flex justify-between"><span>−1</span><span>0</span><span>+1</span></div></div>
            </div>
          </Section>

          <Section phase="Phase 3" title="Model selection in one line">
            <p className="text-[15px] max-w-2xl">
              Linear + interactions had the lowest cross-validated RMSE for both targets: root elongation R² <strong className="num">{MODEL_METRICS[2].r2.toFixed(3)}</strong> (RMSE {MODEL_METRICS[2].rmse.toFixed(3)}),
              gene proxy R² <strong className="num">{MODEL_METRICS[7].r2.toFixed(3)}</strong> (RMSE {MODEL_METRICS[7].rmse.toFixed(3)}).{" "}
              <button onClick={() => setView("validation")} className="underline underline-offset-4 font-semibold">See every model</button>
            </p>
          </Section>

          <Section phase="Phase 4" title="Dose-response scenarios">
            <FigureCaption title="Predicted root rate against hydrogel dose" source="Three illustrative soils: 60 kPa / 2 mm per day; 40 kPa / 4 mm per day; 25 kPa / 7 mm per day." caveat="Curves inherit the generator's assumptions and are bounded to the synthetic target range." />
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={doseResponse} margin={{ top: 8, right: 130, left: 0, bottom: 8 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="dose" tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} tick={axisTick} tickFormatter={(v) => `${v}%`} />
                  <YAxis tickLine={false} axisLine={false} width={36} tick={axisTick} domain={["auto", "auto"]} />
                  <Tooltip cursor={{ stroke: "hsl(var(--foreground))" }} labelFormatter={(v) => `Hydrogel ${v}%`} formatter={(v: any, name: any) => [`${Number(v).toFixed(2)} mm/day`, name]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 13, color: "hsl(var(--foreground))" }} />
                  {[
                    ["mild", "Lower rigidity, more rain", "0"],
                    ["moderate", "Moderate conditions", "6 4"],
                    ["harsh", "High rigidity, low rain", "1 4"],
                  ].map(([k, name, dash]) => (
                    <Line key={k} type="linear" dataKey={k} name={name} stroke="hsl(var(--model))" strokeWidth={2.5} strokeDasharray={dash === "0" ? undefined : dash} strokeLinecap="round" dot={false}
                      activeDot={{ r: 5, stroke: "hsl(var(--background))", strokeWidth: 2 }} animationDuration={600} animationEasing="ease-out"
                      label={(p: any) => p.index === doseResponse.length - 1
                        ? <text key={k} x={p.x + 8} y={p.y} dy={4} fontSize={12} fontWeight={600} fill="hsl(var(--foreground))">{name}</text>
                        : <g key={p.index} />} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">Same predicted quantity in all three lines, so one hue; solid, dashed and dotted lines tell the soils apart. <button onClick={() => setView("scenario")} className="underline underline-offset-4 font-semibold">Try your own scenario</button></p>
          </Section>

          <section className="grid gap-8 md:grid-cols-2 border-t border-foreground pt-3">
            <div><h3 className="font-display text-lg font-bold">What this can demonstrate</h3><p className="text-sm text-muted-foreground mt-2">A reproducible dataset audit, summary statistics, model-family comparison, and working inference inside the actual app.</p></div>
            <div><h3 className="font-display text-lg font-bold">What still needs evidence</h3><p className="text-sm text-muted-foreground mt-2">Real treatment response, optimal dose, crop-specific recommendations and EXPA1 transcriptomic response need published evidence and ideally controlled measurements.</p></div>
          </section>
        </div>
      )}

      {view === "validation" && (
        <div className="space-y-12">
          <Section title="Compare model families">
            <p className="text-sm text-muted-foreground max-w-3xl">Scores use 5-fold CV repeated 3 times on the 800-row training partition. The 200-row holdout is separate; final holdout scores are in the report.</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Target" className="inline-flex border border-foreground rounded-md overflow-hidden text-sm font-semibold">
                {([["root", "Root elongation"], ["gene", "Gene proxy"]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setTarget(k)} aria-pressed={target === k} className={cn("min-h-11 px-4 transition-colors duration-100", target === k ? "bg-foreground text-background" : "hover:bg-muted")}>{l}</button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setShowBaseline((v) => !v)} className="min-h-11 text-sm font-semibold underline underline-offset-4">{showBaseline ? "Hide baseline" : "Show baseline"}</button>
                <button onClick={downloadMetrics} className="min-h-11 inline-flex items-center gap-1.5 px-3 border border-border rounded-md text-sm font-semibold hover:border-foreground transition-colors duration-100"><Download className="w-4 h-4" aria-hidden /> Export metrics CSV</button>
              </div>
            </div>

            <div className="mt-6">
              <FigureCaption title={`Mean CV R² for ${targetLabel.toLowerCase()}`} source="Dot is the mean, whisker is ±1 SD across folds. The blue dot has the lowest CV RMSE." caveat="R² here measures how well models reconstruct programmed patterns; it is not real-world performance." />
              <R2DotPlot rows={visibleMetrics} bestModel={selectedMetric.model} />
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm num">
                <caption className="sr-only">Cross-validated scores for {targetLabel}</caption>
                <thead><tr className="border-b border-foreground text-left"><th className="py-2 pr-3 font-semibold">Model</th><th className="py-2 pr-3 font-semibold text-right">R² mean ± SD</th><th className="py-2 pr-3 font-semibold text-right">MAE</th><th className="py-2 font-semibold text-right">RMSE</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {currentMetrics.map((m) => (
                    <tr key={m.model}>
                      <td className="py-2.5 pr-3 font-semibold">{m.model}{m.model === selectedMetric.model && <span className="ml-2 text-xs font-semibold text-model-ink">Lowest RMSE</span>}</td>
                      <td className="py-2.5 pr-3 text-right">{fmt(m.r2, 4)} ± {fmt(m.r2Sd, 4)}</td>
                      <td className="py-2.5 pr-3 text-right">{fmt(m.mae, 4)}</td>
                      <td className="py-2.5 text-right">{fmt(m.rmse, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">MAE and RMSE are in the target&apos;s units; lower is better. Selection uses mean RMSE from these training folds.</p>
            </div>
          </Section>

          <Section title="Which inputs matter">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <FigureCaption title="Permutation importance" source="Drop in held-out R² when a feature is shuffled; Random Forest, 50 permutations (permutation_importance.csv)." caveat="Diagnostic association, not causality." />
                <ul className="flex gap-5 text-sm mb-1" aria-label="Legend">
                  <li className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-foreground" aria-hidden />Root elongation</li>
                  <li className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-model" aria-hidden />Gene proxy</li>
                </ul>
                {PERMUTATION_IMPORTANCE.map((f) => (
                  <div key={f.feature} className="py-2.5 border-b border-border last:border-0">
                    <p className="text-sm font-semibold">{f.feature}</p>
                    <BarRow label="Root" value={f.root} max={0.8} text={`${f.root.toFixed(3)} ± ${f.rootSd.toFixed(3)}`} />
                    <BarRow label="Gene" value={f.gene} max={0.8} text={`${f.gene.toFixed(3)} ± ${f.geneSd.toFixed(3)}`} tone="model" />
                  </div>
                ))}
              </div>
              <div>
                <FigureCaption title="One-at-a-time sensitivity" source="Predicted root-rate swing from each input's 10th to 90th percentile, others at their medians." caveat="Model sensitivity inside a constructed scenario, not a universal optimal dose." />
                {SENSITIVITY.map((s) => (
                  <BarRow key={s.feature} label={s.feature} value={Math.abs(s.swing)} max={3.6} tone={s.swing < 0 ? "warn" : "ink"}
                    text={`${s.swing > 0 ? "+" : "−"}${Math.abs(s.swing).toFixed(2)} mm/day`}
                    note={`${s.swing < 0 ? "Lowers" : "Raises"} root rate · P10 ${s.p10.toFixed(2)} → P90 ${s.p90.toFixed(2)}`} />
                ))}
              </div>
            </div>
          </Section>

          <Section title="When the model leaves the data">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <FigureCaption title="High-rigidity extrapolation test" source="Trained on lower rigidity, tested on withheld higher-rigidity rows." caveat="Synthetic distribution shift, not real soil." />
                {EXTRAPOLATION_STRESS_TEST.map((e) => {
                  const biased = Math.abs(e.bias) > 0.3;
                  return (
                    <BarRow key={e.model} label={e.model} value={e.mae} max={1} tone={biased ? "warn" : "ink"}
                      text={`MAE ${e.mae.toFixed(3)}`}
                      note={`R² ${e.r2.toFixed(3)} · bias ${e.bias > 0 ? "+" : "−"}${Math.abs(e.bias).toFixed(3)} mm/day${biased ? " (over-predicts)" : ""}`} />
                  );
                })}
                <p className="text-xs text-muted-foreground mt-2">The tree models lose the most outside the training range, which is why the lab greys that region out.</p>
              </div>
              <div>
                <FigureCaption title="Interval calibration" source={`Separate synthetic exercise: ${INTERVAL_CALIBRATION.trainingRows} training, ${INTERVAL_CALIBRATION.calibrationRows} calibration, ${INTERVAL_CALIBRATION.testRows} test rows.`} />
                <BarRow label="Nominal coverage" value={INTERVAL_CALIBRATION.nominalCoverage} max={1} text={`${(INTERVAL_CALIBRATION.nominalCoverage * 100).toFixed(0)}%`} />
                <BarRow label="Empirical coverage" value={INTERVAL_CALIBRATION.empiricalCoverage} max={1} tone="model" text={`${(INTERVAL_CALIBRATION.empiricalCoverage * 100).toFixed(1)}%`} />
                <dl className="grid grid-cols-2 gap-6 mt-5">
                  <div><dt className="text-sm text-muted-foreground">90% half-width</dt><dd className="font-display text-2xl font-bold num">±{INTERVAL_CALIBRATION.halfWidth.toFixed(2)}<span className="text-sm text-muted-foreground font-medium ml-1">mm/day</span></dd></div>
                  <div><dt className="text-sm text-muted-foreground">Root residual SD</dt><dd className="font-display text-2xl font-bold num">{RESIDUAL_STANDARD_DEVIATIONS.root.toFixed(2)}<span className="text-sm text-muted-foreground font-medium ml-1">mm/day</span></dd></div>
                  <div className="col-span-2"><dt className="text-sm text-muted-foreground">Proxy residual SD</dt><dd className="font-display text-2xl font-bold num">{RESIDUAL_STANDARD_DEVIATIONS.geneProxy.toFixed(2)}</dd><dd className="text-xs text-muted-foreground">Simulated proxy spread, not lab-assay precision.</dd></div>
                </dl>
              </div>
            </div>
          </Section>

          <section className="border-l-2 border-warn pl-4 max-w-3xl">
            <h3 className="font-display text-lg font-bold">Keep validation designs separate</h3>
            <p className="text-sm text-muted-foreground mt-2">Phase 3 selected models using repeated 5-fold CV × 3 repeats on 800 training rows, then evaluated candidates on a separate 200-row holdout. The Phase 4 supplemental figure uses 5-fold CV × 5 repeats across the full synthetic dataset. These answer different questions and should not be combined into one score.</p>
            <p className="text-sm text-muted-foreground mt-2">The API models are refit on all 1,000 generated rows for the local demo. Holdout tables are separate comparison evidence; the deployed inference is not a real-world validated crop model.</p>
          </section>
        </div>
      )}

      <footer className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground max-w-xl">Methodology, data-generation log and reproducibility steps are documented in the project repository.</p>
        <div className="flex gap-5 font-semibold">
          <Link href="/methods" className="underline underline-offset-4">Data &amp; Methods</Link>
          <Link href="/more" className="underline underline-offset-4">Back to app tools</Link>
        </div>
      </footer>
    </div>
  );
}
