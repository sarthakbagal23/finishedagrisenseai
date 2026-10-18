"use client";

import { useEffect, useMemo, useState } from "react";
import data from "@/data/dataset-site.json";

type Row = Record<string, string>;

export function DatasetExplorer() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState(data.columns[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/data/agrisense_synthetic_trials.csv")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load the dataset");
        return response.text();
      })
      .then((csv) => {
        const [header, ...lines] = csv.trim().split(/\r?\n/);
        const columns = header.split(",");
        const parsed = lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [columns[index], value])));
        if (active) setRows(parsed);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const tiers = useMemo(() => Array.from(new Set(rows.map((row) => row.Hydrogel_Concentration_Percent))).sort((a, b) => Number(a) - Number(b)), [rows]);
  const filtered = useMemo(() => rows
    .filter((row) => tier === "all" || row.Hydrogel_Concentration_Percent === tier)
    .filter((row) => !search || Object.values(row).some((value) => value.toLowerCase().includes(search.trim().toLowerCase())))
    .sort((a, b) => {
      const left = Number(a[sort]);
      const right = Number(b[sort]);
      return Number.isFinite(left) && Number.isFinite(right)
        ? left - right
        : (a[sort] ?? "").localeCompare(b[sort] ?? "", undefined, { numeric: true });
    }), [rows, search, sort, tier]);

  return <section aria-labelledby="explorer">
    <div className="flex flex-col gap-4 border-y border-foreground py-5 md:flex-row md:items-end md:justify-between">
      <div><p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Interactive data explorer</p><h3 id="explorer" className="font-display text-2xl font-bold mt-1">Browse all 1,000 trials</h3><p className="text-sm text-muted-foreground mt-1">Filter by simulated hydrogel tier, search values, or sort a column.</p></div>
      <a href="/data/agrisense_synthetic_trials.csv" download className="inline-flex min-h-11 items-center justify-center border border-foreground px-4 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors">Download all rows</a>
    </div>
    <div className="grid gap-3 py-4 sm:grid-cols-3">
      <label className="text-xs font-semibold text-muted-foreground">Search all fields<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. 0.5 or trial_0021" className="mt-1 block h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" /></label>
      <label className="text-xs font-semibold text-muted-foreground">Hydrogel tier<select value={tier} onChange={(e) => setTier(e.target.value)} className="mt-1 block h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"><option value="all">All tiers</option>{tiers.map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>
      <label className="text-xs font-semibold text-muted-foreground">Sort by<select value={sort} onChange={(e) => setSort(e.target.value)} className="mt-1 block h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">{data.columns.map((column) => <option key={column} value={column}>{column.replace(/_/g, " ")}</option>)}</select></label>
    </div>
    <p className="text-sm text-muted-foreground mb-2" aria-live="polite">{loading ? "Loading the CSV…" : error ? "The interactive table could not load. Download the CSV to explore it." : `${filtered.length.toLocaleString()} matching rows · sorted low to high`}</p>
    {!error && <div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[700px] text-xs num">
      <thead><tr className="text-left border-b border-border">{data.columns.map((column) => <th key={column} className="py-2 pr-4 font-semibold whitespace-nowrap">{column.replace(/_/g, " ")}</th>)}</tr></thead>
      <tbody className="divide-y divide-border">{filtered.slice(0, 12).map((row) => <tr key={row.Trial_ID}>{data.columns.map((column) => <td key={column} className="py-2 pr-4 whitespace-nowrap">{row[column]}</td>)}</tr>)}</tbody>
    </table></div>}
    {!loading && filtered.length > 12 && <p className="mt-2 text-xs text-muted-foreground">Showing the first 12 matches. Download the CSV for the complete view.</p>}
  </section>;
}
