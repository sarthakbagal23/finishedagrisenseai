import data from "@/data/dataset-site.json";

/**
 * Every synthetic trial as one dot: soil rigidity (x) against root elongation (y).
 * Static SVG so it renders instantly on the first screen. Blue marks generated (not observed) data.
 */
export function TrialScatter({ className }: { className?: string }) {
  const W = 560, H = 420, L = 52, R = 12, T = 34, B = 68;
  const x = (v: number) => L + ((v - 5) / (70 - 5)) * (W - L - R);
  const y = (v: number) => H - B - ((v - 2) / (14 - 2)) * (H - T - B);
  const xt = [10, 30, 50, 70];
  const yt = [4, 8, 12];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img"
      aria-label={`Scatter of ${data.n} synthetic trials: as soil rigidity rises from 5 to 70 kilopascals, simulated root elongation falls from about 14 to about 3 millimetres per day. Correlation ${data.r_rigidity_root}.`}>
      {yt.map((t) => <line key={t} x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="hsl(var(--border))" />)}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="hsl(var(--foreground))" />
      {data.points.map((p, i) => (
        <circle key={i} cx={x(p[0])} cy={y(p[1])} r={2.6} fill="hsl(var(--model))" fillOpacity={0.4} />
      ))}
      {xt.map((t) => <text key={t} x={x(t)} y={H - B + 24} textAnchor="middle" fontSize={17} fill="hsl(var(--muted-foreground))" className="num">{t}</text>)}
      {yt.map((t) => <text key={t} x={L - 10} y={y(t) + 6} textAnchor="end" fontSize={17} fill="hsl(var(--muted-foreground))" className="num">{t}</text>)}
      <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize={17} fill="hsl(var(--foreground))">Soil rigidity (kPa)</text>
      <text x={L} y={14} fontSize={17} fill="hsl(var(--foreground))">Root elongation (mm/day)</text>
    </svg>
  );
}
