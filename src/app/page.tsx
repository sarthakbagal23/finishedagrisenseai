import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { TrialScatter } from "@/components/viz/TrialScatter";
import data from "@/data/dataset-site.json";

const PARTS = [
  {
    n: "01",
    title: "Understand the problem",
    body: "When soil dries out it can harden, and hard soil is harder for roots to push through. Our research question is whether that mechanism, and a hydrogel soil amendment, show up in a dataset built to explore it.",
    href: "/methods",
    cta: "Scope and limits",
  },
  {
    n: "02",
    title: "Explore the research",
    body: "A 1,000-trial synthetic dataset you can download, with every column defined, the generation record, the quality checks and three charts that each say what they can and cannot show.",
    href: "/dataset",
    cta: "Explore the dataset",
  },
  {
    n: "03",
    title: "Connect it to real life",
    body: "Our data is simulated, so it cannot tell a farmer what to do. For decisions today the site points to India Meteorological Department agromet advisories and the ICAR Krishi Vigyan Kendra network.",
    href: "/resources",
    cta: "Farmer resources",
  },
];

export default function Story() {
  return (
    <div className="space-y-16 md:space-y-20 pb-8">
      <section className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 items-start" aria-labelledby="title">
        <div>
          <p className="text-sm text-muted-foreground">TSA Data Science and Analytics 2026–27 · climate and environmental sustainability</p>
          <h2 id="title" className="font-display text-[2.6rem] leading-[1.02] md:text-6xl font-bold mt-4 text-balance">
            From climate data to farmer resources.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            A research project on drought-related soil hardening and root growth, with a plain line drawn between what a simulation can show and where farmers can get trusted help today.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/dataset" className="inline-flex items-center gap-2 min-h-12 px-5 bg-primary text-primary-foreground rounded-md font-semibold transition-colors duration-100 hover:opacity-90">
              Explore the dataset <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <a href="/data/agrisense_synthetic_trials.csv" download className="inline-flex items-center gap-2 min-h-12 font-semibold underline underline-offset-4">
              <Download className="w-4 h-4" aria-hidden /> Download dataset (CSV)
            </a>
          </div>
        </div>

        <figure>
          <TrialScatter className="w-full h-auto" />
          <figcaption className="mt-2 text-sm text-muted-foreground max-w-md">
            <strong className="text-foreground">Each dot is one of {data.n.toLocaleString()} synthetic trials.</strong> Harder soil goes with slower roots (r = {data.r_rigidity_root.toString().replace("-", "−")}) because we wrote that relationship into the generator. It is a starting question, not a finding about real plants.
          </figcaption>
        </figure>
      </section>

      <section aria-label="Dataset at a glance">
        <dl className="grid grid-cols-2 md:grid-cols-4 border-y border-foreground divide-x divide-border">
          {[
            ["Trials", "1,000", "synthetic rows"],
            ["Columns", "6", "each defined and unit-labelled"],
            ["Missing values", "0", "plus 0 duplicate IDs"],
            ["Generated", "9 Oct 2026", "fixed seed 20261009"],
          ].map(([k, v, n]) => (
            <div key={k} className="px-4 py-5 first:pl-0">
              <dt className="text-sm text-muted-foreground">{k}</dt>
              <dd className="font-display text-3xl md:text-4xl font-bold num mt-1">{v}</dd>
              <dd className="text-sm text-muted-foreground mt-0.5">{n}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="path">
        <h3 id="path" className="sr-only">Three parts of the project</h3>
        <ol className="divide-y divide-border border-b border-border">
          {PARTS.map((p) => (
            <li key={p.n} className="grid gap-x-8 gap-y-2 py-7 md:grid-cols-[88px_minmax(0,1fr)_200px] items-baseline">
              <span className="font-display text-4xl md:text-5xl font-bold text-muted-foreground num" aria-hidden>{p.n}</span>
              <div>
                <h4 className="font-display text-xl md:text-2xl font-bold">{p.title}</h4>
                <p className="mt-2 text-[15px] text-muted-foreground max-w-2xl">{p.body}</p>
              </div>
              <Link href={p.href} className="inline-flex items-center gap-2 min-h-11 font-semibold underline underline-offset-4 md:justify-self-end">
                {p.cta} <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="pattern" className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div>
          <h3 id="pattern" className="font-display text-2xl font-bold">How every result is framed</h3>
          <p className="mt-2 text-[15px] text-muted-foreground">Four steps, in this order, so a simulated pattern is never mistaken for advice.</p>
        </div>
        <ol className="grid gap-px bg-border border border-border sm:grid-cols-2">
          {[
            ["Simulated finding", "In our dataset, root elongation falls as soil rigidity rises."],
            ["What it might suggest", "Compacted, dry soil is a plausible barrier to root growth, which is worth testing."],
            ["What we still need to verify", "Real soil measurements, real roots, real rainfall. None of that is in this dataset."],
            ["Trusted resource today", "Your district's IMD agromet bulletin and local Krishi Vigyan Kendra."],
          ].map(([t, b], i) => (
            <li key={t} className="bg-background p-5">
              <p className="text-sm text-muted-foreground num">Step {i + 1}</p>
              <p className="font-display text-lg font-bold mt-0.5">{t}</p>
              <p className="text-[15px] text-muted-foreground mt-1">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-l-2 border-warn pl-5 max-w-3xl" aria-labelledby="claims">
        <h3 id="claims" className="font-display text-xl font-bold">What this site does not claim</h3>
        <ul className="mt-2 space-y-1.5 text-[15px] text-muted-foreground list-disc pl-5">
          <li>That hydrogel improves real crops or that there is an optimal dose.</li>
          <li>That the EXPA1-like column is measured gene expression. It is a made-up proxy.</li>
          <li>That the rainfall values are Indian climate data. They are a generated scenario.</li>
          <li>That any model here can advise a farmer.</li>
        </ul>
        <p className="mt-3 text-sm"><Link href="/methods" className="underline underline-offset-4 font-semibold">Read the full limitations and sources</Link></p>
      </section>
    </div>
  );
}
