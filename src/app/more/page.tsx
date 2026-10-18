import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

type RouteLink = { title: string; desc: string; href: string };

const RESEARCH: RouteLink[] = [
  { title: "Methods & limits", desc: "How the data was made, what it can show and where each source comes from", href: "/methods" },
  { title: "Research Lab", desc: "Explore the simulated scenarios, model validation and extrapolation limits", href: "/research" },
];

const TOOL_GROUPS: { title: string; links: RouteLink[] }[] = [
  {
    title: "Field conditions",
    links: [
      { title: "Field dashboard", desc: "Soil readings, daily tasks and demo controls", href: "/field" },
      { title: "Soil sensors", desc: "Current simulated readings and sample history", href: "/sensors" },
      { title: "Weather", desc: "Forecast and rainfall outlook", href: "/weather" },
      { title: "Market prices", desc: "Sample crop prices and trends", href: "/prices" },
    ],
  },
  {
    title: "Crop care",
    links: [
      { title: "Farm advisor", desc: "Ask a farming question or review suggestions", href: "/advisor" },
      { title: "Crop diagnosis", desc: "Try the leaf-photo diagnosis flow", href: "/diagnosis" },
      { title: "Field journal", desc: "Keep notes about observations and work", href: "/journal" },
      { title: "Learning library", desc: "Browse lessons and farming guides", href: "/education" },
    ],
  },
  {
    title: "Programs & account",
    links: [
      { title: "Schemes & services", desc: "Find government programs and farm support", href: "/schemes" },
      { title: "Farm services", desc: "Explore sample service and equipment flows", href: "/services" },
      { title: "Plan & access", desc: "Review the prototype subscription screen", href: "/subscription" },
      { title: "Settings", desc: "Change language, crop and location preferences", href: "/settings" },
    ],
  },
];

function RouteList({ links }: { links: RouteLink[] }) {
  return (
    <ul className="divide-y divide-border border-t border-border">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="group flex min-h-[66px] items-center justify-between gap-4 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{link.title}</span>
              <span className="mt-0.5 block max-w-[58ch] text-[13px] leading-5 text-muted-foreground">{link.desc}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-100 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MoreHub() {
  return (
    <div className="space-y-12 pb-8 md:space-y-16">
      <header className="max-w-3xl">
        <h2 className="font-display text-3xl font-bold tracking-[-0.025em] sm:text-4xl">Explore the rest of the project</h2>
        <p className="mt-3 max-w-[68ch] text-[15px] leading-6 text-muted-foreground">Research pages explain the synthetic study. Farm tools are an interactive prototype: no sensor controls connect to hardware, and sample prices are not live market rates.</p>
      </header>

      <section className="grid gap-5 border-t border-border pt-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10" aria-labelledby="research-links">
        <div>
          <h3 id="research-links" className="font-display text-xl font-semibold">Research references</h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">Methods, limitations and the interactive model demo.</p>
        </div>
        <RouteList links={RESEARCH} />
      </section>

      <section className="grid gap-5 border-t border-border pt-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10" aria-labelledby="farm-tools">
        <div>
          <p className="text-xs font-semibold text-warn">Prototype tools</p>
          <h3 id="farm-tools" className="mt-1 font-display text-xl font-semibold">Farm tools</h3>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">Interactive examples grouped by the job they support.</p>
        </div>
        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {TOOL_GROUPS.map((group) => (
            <section key={group.title} aria-labelledby={`group-${group.title.replace(/\W+/g, "-").toLowerCase()}`}>
              <h4 id={`group-${group.title.replace(/\W+/g, "-").toLowerCase()}`} className="mb-2 font-display text-base font-semibold">{group.title}</h4>
              <RouteList links={group.links} />
            </section>
          ))}
        </div>
      </section>

      <p className="border-t border-border pt-5 text-sm text-muted-foreground">
        Looking for the first step? <Link href="/" className="inline-flex min-h-11 items-center gap-1 font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">Return to the project story <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </p>
    </div>
  );
}
