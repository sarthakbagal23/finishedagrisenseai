"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, Beaker, CheckCircle2, ChevronRight, Database,
  Download, FlaskConical, Info, Microscope, ShieldAlert, SlidersHorizontal,
  Sprout, Target, TrendingUp,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  CORRELATIONS, DATASET_AUDIT, EXTRAPOLATION_STRESS_TEST, INTERVAL_CALIBRATION,
  MODEL_METRICS, OBSERVED_RANGES, RESIDUAL_STANDARD_DEVIATIONS, SENSITIVITY,
  predictSyntheticScenario,
} from "@/data/agrisense-research";

type View = "overview" | "scenario" | "validation";
type Target = "root" | "gene";

const axisStyle = { fill: "#8c9788", fontSize: 10 };
const gridStroke = "rgba(142, 160, 137, 0.14)";
const tooltipStyle = { background: "#11170f", border: "1px solid #293326", borderRadius: 10, color: "#f0f0e9", fontSize: 12 };
const fmt = (n: number, digits = 2) => n.toFixed(digits);

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="mb-4">
    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
    <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-foreground md:text-xl">{title}</h3>
    {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
  </div>;
}

function MetricCard({ icon: Icon, label, value, note, tone = "green" }: {
  icon: typeof Database; label: string; value: string; note: string; tone?: "green" | "amber" | "blue";
}) {
  const toneClass = tone === "amber" ? "text-accent bg-accent/10 border-accent/20" :
    tone === "blue" ? "text-blue-300 bg-blue-400/10 border-blue-400/20" :
    "text-primary bg-primary/10 border-primary/20";
  return <div className="rounded-xl border border-border bg-card/80 p-4 md:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">{value}</p>
      </div>
      <div className={cn("rounded-lg border p-2", toneClass)}><Icon className="h-4 w-4" /></div>
    </div>
    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{note}</p>
  </div>;
}

function RangeControl({ label, value, min, max, step, unit, onChange, observedMin, observedMax }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (value: number) => void; observedMin: number; observedMax: number;
}) {
  const outside = value < observedMin || value > observedMax;
  return <div className="rounded-xl border border-border/70 bg-background/40 p-4">
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <span className="rounded-lg border border-border bg-secondary/70 px-2.5 py-1 font-mono text-sm font-bold text-foreground">
        {fmt(value, step < 1 ? 2 : 0)} <span className="text-[10px] font-medium text-muted-foreground">{unit}</span>
      </span>
    </div>
    <input aria-label={label} type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary" />
    <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
      <span>{min} {unit}</span><span>{max} {unit}</span>
    </div>
    <div className={cn("mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed", outside ? "text-accent" : "text-muted-foreground")}>
      {outside ? <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />}
      <span>{outside
        ? "Outside observed training range (" + observedMin + "–" + observedMax + " " + unit + "); treat as extrapolation."
        : "Inside observed training range (" + observedMin + "–" + observedMax + " " + unit + ")."}</span>
    </div>
  </div>;
}

export default function ResearchLabPage() {
  const [view, setView] = useState<View>("overview");
  const [target, setTarget] = useState<Target>("root");
  const [rigidity, setRigidity] = useState(55);
  const [hydrogel, setHydrogel] = useState(1);
  const [rainfall, setRainfall] = useState(3);
  const [showBaseline, setShowBaseline] = useState(true);

  const prediction = useMemo(() => predictSyntheticScenario({ rigidity, hydrogel, rainfall }), [rigidity, hydrogel, rainfall]);
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
  const selectedMetric = currentMetrics.reduce((best, m) => m.rmse < best.rmse ? m : best, currentMetrics[0]);
  const targetLabel = target === "root" ? "Root elongation rate" : "EXPA1-like proxy";

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

  return <div className="space-y-7 pb-8">
    <header className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary"><FlaskConical className="h-3 w-3" /> Research sandbox</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent"><ShieldAlert className="h-3 w-3" /> Synthetic data</span>
        </div>
        <h2 className="max-w-3xl font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">From soil stress to root response.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Explore the AgriSense drought-hardening research scenario: soil rigidity, hydrogel concentration, and rainfall versus simulated root elongation and an EXPA1-like response proxy. This research layer is part of the existing AgriSense app; the farm dashboard remains intact.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => setView("scenario")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90">Open scenario lab <ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => setView("validation")} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30">Model validation <Activity className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/5 p-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p><strong className="text-foreground">Important:</strong> all 1,000 rows are formula-generated synthetic data. The proxy is not measured EXPA1 expression, and model scores do not establish real biological effects or provide farm treatment advice.</p>
        </div>
      </div>
    </header>

    <nav aria-label="Research sections" className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card/70 p-1">
      {([
        ["overview", "Overview", Activity],
        ["scenario", "Scenario lab", SlidersHorizontal],
        ["validation", "Model validation", Target],
      ] as const).map(([key, label, Icon]) => <button key={key} onClick={() => setView(key)}
        className={cn("flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition md:gap-2 md:text-sm",
          view === key ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground")}>
        <Icon className="h-4 w-4" />{label}
      </button>)}
    </nav>

    {view === "overview" && <div className="space-y-7">
      <section>
        <SectionTitle eyebrow="Phase 1 · Data quality" title="A clean starting dataset" description="Quality-control checks from the generated source file. Statistical outlier flags are retained for review, not automatically deleted." />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard icon={Database} label="Synthetic rows" value={DATASET_AUDIT.rowsCleaned.toLocaleString()} note="Original and cleaned files have the same row count." />
          <MetricCard icon={CheckCircle2} label="Missing values" value={String(DATASET_AUDIT.missingValues)} note="Across six required dataset columns." tone="blue" />
          <MetricCard icon={ShieldAlert} label="Rows removed" value={String(DATASET_AUDIT.rowsRemoved)} note="No integrity-rule row removals were required." tone="amber" />
          <MetricCard icon={AlertTriangle} label="IQR flag entries" value={String(DATASET_AUDIT.featureLevelOutlierFlags)} note="Flags across features; some may refer to the same row." tone="amber" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-border bg-card/80 p-4 md:p-5">
          <SectionTitle eyebrow="Phase 2 · Relationships" title="What the synthetic data encodes" description="Pearson correlations describe association within the generated rows; they are not causal estimates." />
          <div className="h-[270px] w-full"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={CORRELATIONS} layout="vertical" margin={{ top: 4, right: 18, bottom: 2, left: 4 }}>
              <CartesianGrid stroke={gridStroke} horizontal={false} />
              <XAxis type="number" domain={[-1, 1]} tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="pair" width={152} tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toFixed(3), "Pearson r"]} />
              <ReferenceLine x={0} stroke="#899184" strokeDasharray="3 3" />
              <Bar dataKey="r" name="Pearson r" radius={[0, 5, 5, 0]} maxBarSize={21}>
                {CORRELATIONS.map((d) => <Cell key={d.pair} fill={d.r < 0 ? "#D4A854" : "#6EE7A8"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer></div>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Source: correlation_matrix.csv. Rainfall and rigidity are correlated in the generated scenario, so their associations should not be interpreted as independent causal effects.</p>
        </div>

        <div className="rounded-xl border border-border bg-card/80 p-4 md:p-5">
          <SectionTitle eyebrow="Phase 3 · Model selection" title="Cross-validation snapshot" description="Selection used mean RMSE on repeated folds of the training partition." />
          <div className="space-y-3">
            {[
              { label: "Root elongation", r2: 0.87284, rmse: 0.728719, color: "bg-primary" },
              { label: "Gene-response proxy", r2: 0.836892, rmse: 0.316421, color: "bg-accent" },
            ].map((m) => <div key={m.label} className="rounded-xl border border-border/70 bg-background/40 p-3.5">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-foreground">{m.label}</p><span className="font-mono text-lg font-bold text-foreground">{m.r2.toFixed(3)}</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-border"><div className={cn("h-full rounded-full", m.color)} style={{ width: (m.r2 * 100) + "%" }} /></div>
              <p className="mt-2 text-[11px] text-muted-foreground">CV RMSE: <strong className="font-mono text-foreground">{m.rmse.toFixed(3)}</strong> · lower is better</p>
            </div>)}
          </div>
          <button onClick={() => setView("validation")} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">Explore all model scores <TrendingUp className="h-3.5 w-3.5" /></button>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Phase 4 · Advanced analysis" title="Dose-response scenarios" description="Fitted synthetic response curves for three illustrative soil conditions. These curves inherit the assumptions in the dataset generator." />
        <div className="rounded-xl border border-border bg-card/80 p-4 md:p-5">
          <div className="h-[285px] w-full"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={doseResponse} margin={{ top: 6, right: 12, bottom: 10, left: 0 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="dose" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => String(v) + "%"} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => "Hydrogel: " + String(v) + "%"} formatter={(v) => [Number(v).toFixed(2) + " mm/day", "Predicted root rate"]} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9ca89a" }} />
              <Line type="monotone" dataKey="harsh" name="High rigidity · low rain" stroke="#EF6461" strokeWidth={2.2} dot={false} />
              <Line type="monotone" dataKey="moderate" name="Moderate conditions" stroke="#D4A854" strokeWidth={2.2} dot={false} />
              <Line type="monotone" dataKey="mild" name="Lower rigidity · more rain" stroke="#6EE7A8" strokeWidth={2.2} dot={false} />
            </LineChart>
          </ResponsiveContainer></div>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Scenario definitions: 60 kPa / 2 mm per day; 40 kPa / 4 mm per day; 25 kPa / 7 mm per day. Outputs use the saved degree-2 interaction model and are bounded to the synthetic target range.</p>
          <button onClick={() => setView("scenario")} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">Try your own scenario <ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/70 p-4"><div className="mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><h3 className="text-sm font-bold text-foreground">What this can demonstrate</h3></div><p className="text-xs leading-relaxed text-muted-foreground">A reproducible dataset audit, summary statistics, model-family comparison, and a functional inference experience embedded in the actual app.</p></div>
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4"><div className="mb-2 flex items-center gap-2"><Microscope className="h-4 w-4 text-accent" /><h3 className="text-sm font-bold text-foreground">What still needs evidence</h3></div><p className="text-xs leading-relaxed text-muted-foreground">Real treatment response, optimal dose, crop-specific recommendations, and EXPA1 transcriptomic response require published evidence and ideally controlled measurements.</p></div>
      </section>
    </div>}

    {view === "scenario" && <div className="space-y-5">
      <section>
        <SectionTitle eyebrow="Interactive simulator" title="Build a soil-stress scenario" description="Changing any input recalculates predictions in the browser from the exported interaction-model coefficients. It does not require a separately hosted Python API." />
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3 rounded-xl border border-border bg-card/80 p-4 md:p-5">
            <RangeControl label="Soil rigidity" value={rigidity} min={5} max={100} step={1} unit="kPa" onChange={setRigidity} observedMin={OBSERVED_RANGES.rigidity.min} observedMax={OBSERVED_RANGES.rigidity.max} />
            <RangeControl label="Hydrogel concentration" value={hydrogel} min={0} max={2} step={0.25} unit="%" onChange={setHydrogel} observedMin={OBSERVED_RANGES.hydrogel.min} observedMax={OBSERVED_RANGES.hydrogel.max} />
            <RangeControl label="Average daily rainfall" value={rainfall} min={0} max={12} step={0.25} unit="mm/day" onChange={setRainfall} observedMin={OBSERVED_RANGES.rainfall.min} observedMax={OBSERVED_RANGES.rainfall.max} />
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => { setRigidity(60); setHydrogel(0); setRainfall(2); }} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground">Harsh reference</button>
              <button onClick={() => { setRigidity(40); setHydrogel(1); setRainfall(4); }} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground">Moderate reference</button>
              <button onClick={() => { setRigidity(25); setHydrogel(1.5); setRainfall(7); }} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground">Mild reference</button>
              <button onClick={() => { setRigidity(55); setHydrogel(1); setRainfall(3); }} className="ml-auto rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/15">Reset</button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-4 md:p-5">
              <div className="flex items-center gap-2 text-primary"><Sprout className="h-4 w-4" /><span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em]">Predicted root elongation</span></div>
              <div className="mt-3 flex items-baseline gap-2"><span className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">{fmt(prediction.root)}</span><span className="text-sm font-medium text-muted-foreground">mm/day</span></div>
              <p className="mt-2 text-xs text-muted-foreground">Raw model: {fmt(prediction.rootRaw, 3)} mm/day</p>
              {prediction.rootWasBounded && <p className="mt-2 text-xs text-accent">Output constrained to generated target range for display.</p>}
            </div>
            <div className="rounded-xl border border-accent/20 bg-gradient-to-br from-accent/10 to-card p-4 md:p-5">
              <div className="flex items-center gap-2 text-accent"><Activity className="h-4 w-4" /><span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em]">EXPA1-like response proxy</span></div>
              <div className="mt-3 flex flex-wrap items-baseline gap-2"><span className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">{fmt(prediction.geneProxy, 3)}</span><span className="text-sm font-medium text-muted-foreground">simulated fold-change units</span></div>
              <p className="mt-2 text-xs text-muted-foreground">Raw model: {fmt(prediction.geneRaw, 4)} · illustrative band: <strong className="text-foreground">{prediction.warningBand}</strong></p>
              {prediction.geneWasBounded && <p className="mt-2 text-xs text-accent">Output constrained to generated proxy range for display.</p>}
            </div>
            <div className={cn("rounded-xl border p-4", prediction.inObservedTrainingRange ? "border-primary/20 bg-primary/5" : "border-accent/25 bg-accent/5")}>
              <div className="flex items-center gap-2">{prediction.inObservedTrainingRange ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <AlertTriangle className="h-4 w-4 text-accent" />}<p className="text-sm font-bold text-foreground">{prediction.inObservedTrainingRange ? "Inside observed feature ranges" : "Extrapolation warning"}</p></div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{prediction.inObservedTrainingRange
                ? "Each input falls between the minimum and maximum represented in the synthetic data. This is not evidence that the scenario is biologically validated."
                : "Outside observed range for: " + prediction.outOfRangeFeatures.join(", ") + ". The model may be unreliable even if the slider allows these values."}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card/70 p-4 md:p-5">
        <SectionTitle eyebrow="How to interpret this" title="A scenario explorer, not an agronomy recommendation" />
        <div className="grid gap-3 md:grid-cols-3">{[
          { n: "01", title: "Change one factor", body: "Compare one variable at a time to understand the synthetic model's response." },
          { n: "02", title: "Watch the observed range", body: "A value may be within the slider limits but outside the data used to fit the model." },
          { n: "03", title: "Do not infer causality", body: "The targets are generated by code; the model learns programmed patterns rather than proving an actual treatment effect." },
        ].map((item) => <div key={item.n} className="rounded-lg border border-border/70 bg-background/40 p-3"><span className="font-mono text-[10px] font-bold text-primary">{item.n}</span><h4 className="mt-1 text-sm font-semibold text-foreground">{item.title}</h4><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p></div>)}</div>
      </section>
    </div>}

    {view === "validation" && <div className="space-y-6">
      <section>
        <SectionTitle eyebrow="Repeated cross-validation" title="Compare model families" description="Phase 3 scores use 5-fold CV repeated 3 times on the 800-row training partition. The 200-row holdout is separate; final holdout scores are in the report." />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/70 p-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTarget("root")} className={cn("rounded-lg px-3 py-2 text-xs font-bold transition", target === "root" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")}>Root elongation</button>
            <button onClick={() => setTarget("gene")} className={cn("rounded-lg px-3 py-2 text-xs font-bold transition", target === "gene" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")}>Gene proxy</button>
          </div>
          <button onClick={downloadMetrics} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"><Download className="h-3.5 w-3.5" /> Export metrics CSV</button>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-xl border border-border bg-card/80 p-4 md:p-5">
            <div className="mb-2 flex items-center justify-between gap-3"><h4 className="text-sm font-bold text-foreground">Mean CV R²</h4><button onClick={() => setShowBaseline((v) => !v)} className="text-[10px] font-semibold text-primary hover:underline">{showBaseline ? "Hide baseline" : "Show baseline"}</button></div>
            <div className="h-[285px] w-full"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={visibleMetrics.map((m) => ({ ...m, short: m.model === "Mean baseline" ? "Baseline" : m.model === "Linear regression" ? "Linear" : m.model === "Linear + interactions" ? "Linear + int." : m.model }))} margin={{ top: 8, right: 14, bottom: 18, left: -10 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="short" tick={axisStyle} tickLine={false} axisLine={false} interval={0} angle={-12} textAnchor="end" height={52} />
                <YAxis domain={[-0.05, 1]} tick={axisStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toFixed(4), "Mean CV R²"]} />
                <ReferenceLine y={0} stroke="#899184" />
                <Bar dataKey="r2" name="Mean CV R²" radius={[5, 5, 0, 0]} maxBarSize={42}>{visibleMetrics.map((m) => <Cell key={m.model} fill={m.model === selectedMetric.model ? "#6EE7A8" : "#71816a"} />)}</Bar>
              </BarChart>
            </ResponsiveContainer></div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">R² is a fit statistic on generated data. Scores show how well candidates reconstruct programmed target patterns; they do not prove real-world predictive performance.</p>
          </div>
          <div className="rounded-xl border border-border bg-card/80 p-4 md:p-5">
            <h4 className="text-sm font-bold text-foreground">Scores for {targetLabel}</h4>
            <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[360px] text-left text-xs">
              <thead className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="py-2 pr-2 font-semibold">Model</th><th className="py-2 pr-2 font-semibold">R² mean ± SD</th><th className="py-2 pr-2 font-semibold">MAE</th><th className="py-2 font-semibold">RMSE</th></tr></thead>
              <tbody>{currentMetrics.map((m) => <tr key={m.model} className={cn("border-b border-border/60 last:border-0", m.model === selectedMetric.model && "bg-primary/5")}>
                <td className="py-3 pr-2 font-medium text-foreground">{m.model}{m.model === selectedMetric.model && <span className="ml-1.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">Lowest CV RMSE</span>}</td>
                <td className="py-3 pr-2 font-mono text-muted-foreground">{fmt(m.r2, 4)} ± {fmt(m.r2Sd, 4)}</td><td className="py-3 pr-2 font-mono text-muted-foreground">{fmt(m.mae, 4)}</td><td className="py-3 font-mono text-muted-foreground">{fmt(m.rmse, 4)}</td>
              </tr>)}</tbody>
            </table></div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">MAE and RMSE use the target's units. Lower values are better. Selection uses mean RMSE from these training folds.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/80 p-4 md:p-5">
          <SectionTitle eyebrow="Supplemental analysis" title="One-at-a-time sensitivity" description="Predicted root-rate swing from each input's 10th to 90th percentile, holding other features at their medians." />
          <div className="space-y-4">{SENSITIVITY.map((s) => <div key={s.feature}>
            <div className="mb-1.5 flex items-center justify-between gap-2"><span className="text-xs font-semibold text-foreground">{s.feature}</span><span className={cn("font-mono text-xs font-bold", s.swing < 0 ? "text-accent" : "text-primary")}>{s.swing > 0 ? "+" : ""}{s.swing.toFixed(2)} mm/day</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-border"><div className={cn("h-full rounded-full", s.swing < 0 ? "bg-accent" : "bg-primary")} style={{ width: (Math.min(100, Math.abs(s.swing) / 3.6 * 100)) + "%" }} /></div>
            <p className="mt-1 text-[10px] text-muted-foreground">P10 {s.p10.toFixed(2)} → P90 {s.p90.toFixed(2)}</p>
          </div>)}</div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">This is model sensitivity inside a constructed scenario, not a causal effect or universally optimal dose.</p>
        </div>
        <div className="rounded-xl border border-border bg-card/80 p-4 md:p-5">
          <SectionTitle eyebrow="Supplemental analysis" title="High-rigidity extrapolation test" description="Models train on lower rigidity values and are tested on higher-rigidity rows withheld from that training subset." />
          <div className="h-[240px] w-full"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={EXTRAPOLATION_STRESS_TEST} margin={{ top: 8, right: 12, bottom: 10, left: -10 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} /><XAxis dataKey="model" tick={axisStyle} tickLine={false} axisLine={false} interval={0} angle={-12} textAnchor="end" height={50} /><YAxis tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toFixed(3) + " mm/day", "MAE"]} />
              <Bar dataKey="mae" name="MAE" fill="#D4A854" radius={[5, 5, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer></div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">Linear + interactions: R² {EXTRAPOLATION_STRESS_TEST[1].r2.toFixed(3)}, MAE {EXTRAPOLATION_STRESS_TEST[1].mae.toFixed(3)}. This is a synthetic distribution-shift check, not a test on real soil measurements.</p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={Target} label="90% interval half-width" value={"±" + INTERVAL_CALIBRATION.halfWidth.toFixed(2) + " mm/day"} note={"Separate synthetic calibration exercise; empirical coverage " + (INTERVAL_CALIBRATION.empiricalCoverage * 100).toFixed(1) + "% on " + INTERVAL_CALIBRATION.testRows + " synthetic test rows."} tone="blue" />
        <MetricCard icon={Activity} label="Root residual SD" value={RESIDUAL_STANDARD_DEVIATIONS.root.toFixed(2) + " mm/day"} note="Out-of-fold residual spread from the supplemental analysis." />
        <MetricCard icon={Beaker} label="Proxy residual SD" value={RESIDUAL_STANDARD_DEVIATIONS.geneProxy.toFixed(2)} note="Residual spread for the simulated proxy, not lab-assay precision." tone="amber" />
      </section>

      <section className="rounded-xl border border-accent/25 bg-accent/5 p-4 md:p-5">
        <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div>
          <h3 className="text-sm font-bold text-foreground">Keep validation designs separate</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Phase 3 selected models using repeated 5-fold CV × 3 repeats on 800 training rows, then evaluated candidates on a separate 200-row holdout. The Phase 4 supplemental figure uses 5-fold CV × 5 repeats across the full synthetic dataset. These answer different questions and should not be combined into one score.</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">The API models are refit on all 1,000 generated rows for the local demo. Holdout tables are separate comparison evidence; the deployed inference is not a real-world validated crop model.</p>
        </div></div>
      </section>
    </div>}

    <footer className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4 md:flex-row md:items-center md:justify-between">
      <div><p className="text-xs font-bold text-foreground">Research resources</p><p className="mt-1 text-[11px] text-muted-foreground">Methodology, data-generation log, and reproducibility steps are documented in the project repository.</p></div>
      <Link href="/more" className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground md:self-auto">Back to app tools <ChevronRight className="h-3.5 w-3.5" /></Link>
    </footer>
  </div>;
}
