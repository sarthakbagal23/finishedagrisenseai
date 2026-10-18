import Link from "next/link";
import { ArrowRight, Download, ExternalLink, FlaskConical } from "lucide-react";
import { TrialScatter } from "@/components/viz/TrialScatter";
import data from "@/data/dataset-site.json";

const METRICS = [
  { label: "Trials generated", value: data.n.toLocaleString(), detail: "formula-generated" },
  { label: "Dataset columns", value: "6", detail: "units and ranges documented" },
  { label: "Missing values", value: "0", detail: "0 duplicate trial IDs" },
  { label: "Random seed", value: "20261009", detail: "same result on every run" },
];

const STEPS = [
  {
    title: "Start with the dataset",
    body: "See the six variables, how the 1,000 rows were generated, and which quality checks they pass.",
    href: "/dataset",
    link: "Inspect the data",
  },
  {
    title: "Read the patterns",
    body: "Compare soil rigidity, root elongation and rainfall. Every chart distinguishes a designed pattern from a real-world finding.",
    href: "/findings",
    link: "View the findings",
  },
  {
    title: "Try the model",
    body: "Change the scenario inputs and see the prediction band move. Values outside the training range are called out.",
    href: "/research",
    link: "Open the Research Lab",
  },
];

export default function Story() {
  return (
    <div className="space-y-14 pb-8 md:space-y-20">
      <section className="grid items-center gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12" aria-labelledby="project-title">
        <div className="max-w-[620px]">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-observed" aria-hidden />
            Climate &amp; environmental sustainability · 2026–27
          </p>
          <h2 id="project-title" className="mt-5 max-w-[16ch] font-display text-[2.65rem] font-bold leading-[0.99] tracking-[-0.04em] text-balance sm:text-5xl lg:text-[3.35rem] 2xl:text-[4rem]">
            What happens to roots as soil dries and hardens?
          </h2>
          <p className="mt-5 max-w-[56ch] text-[16px] leading-7 text-muted-foreground sm:text-[17px]">
            A 1,000-row simulation of soil, rainfall and roots. No plants were measured.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/dataset" className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Explore the dataset <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <figure className="min-w-0 border-y border-border py-3 lg:py-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><FlaskConical className="h-3.5 w-3.5 text-model-ink" aria-hidden /> Generated relationship</span>
            <span className="num">n = {data.n.toLocaleString()}</span>
          </div>
          <TrialScatter className="h-auto max-h-[230px] w-full sm:max-h-none" />
          <figcaption className="mt-1 max-w-[66ch] text-[13px] leading-5 text-muted-foreground">
            In the generated data, root elongation falls as rigidity rises (r = {data.r_rigidity_root.toString().replace("-", "−")}). That pattern is built in, not measured.
          </figcaption>
        </figure>
      </section>

      <section aria-label="Dataset quality at a glance" className="border-y border-border">
        <dl className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
          {METRICS.map((metric, index) => (
            <div key={metric.label} className={`min-w-0 px-4 py-4 sm:px-5 sm:py-5 ${index % 2 === 0 ? "pl-0 sm:pl-5" : ""} ${index === 0 ? "sm:pl-0" : ""}`}>
              <dt className="text-xs text-muted-foreground">{metric.label}</dt>
              <dd className="mt-1 font-display text-[1.7rem] font-bold leading-tight tracking-[-0.03em] num sm:text-3xl">{metric.value}</dd>
              <dd className="mt-1 text-xs leading-5 text-muted-foreground">{metric.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="explore-title" className="grid gap-7 lg:grid-cols-[minmax(200px,0.7fr)_1.3fr] lg:gap-12">
        <div>
          <h3 id="explore-title" className="max-w-[14ch] font-display text-2xl font-bold leading-tight tracking-[-0.025em] sm:text-3xl">Follow the question from data to limits.</h3>
          <p className="mt-3 max-w-[36ch] text-sm leading-6 text-muted-foreground">Each step shows what the simulation can tell us, then where it stops.</p>
          <a href="/data/agrisense_synthetic_trials.csv" download className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground">
            <Download className="h-4 w-4" aria-hidden /> Download all 1,000 rows
          </a>
        </div>
        <ol className="divide-y divide-border border-t border-border">
          {STEPS.map((step, index) => (
            <li key={step.href} className="grid items-start gap-x-5 gap-y-2 py-5 sm:grid-cols-[34px_minmax(0,1fr)_auto] sm:items-center">
              <span className="font-display text-lg font-semibold text-muted-foreground num" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h4 className="font-display text-lg font-semibold">{step.title}</h4>
                <p className="mt-1 max-w-[62ch] text-sm leading-6 text-muted-foreground">{step.body}</p>
              </div>
              <Link href={step.href} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground sm:justify-self-end">
                {step.link} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 border-t border-border pt-7 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12" aria-labelledby="boundary-title">
        <div>
          <p className="text-xs font-semibold text-warn">A clear boundary</p>
          <h3 id="boundary-title" className="mt-2 max-w-[16ch] font-display text-2xl font-bold leading-tight tracking-[-0.025em]">A simulation cannot guide a real farm decision.</h3>
        </div>
        <div className="max-w-[70ch]">
          <p className="text-[15px] leading-7 text-muted-foreground">The 1,000 rows are formula-generated. Rainfall is a scenario, and the EXPA1-like value is a made-up response proxy, not a gene-expression measurement. The study makes no claim that hydrogel improves crops or that a dose is optimal.</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/methods" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground">Read all limits and sources <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <Link href="/resources" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground">Find trusted farmer resources <ExternalLink className="h-4 w-4" aria-hidden /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
