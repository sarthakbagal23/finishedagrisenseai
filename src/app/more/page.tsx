"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useSensors } from "@/context/SensorContext";

type Row = { title: string; desc: string; href: string };

export default function MoreHub() {
  const { t } = useSensors();

  const groups: { heading: string; note?: string; rows: Row[] }[] = [
    {
      heading: "The research",
      rows: [
        { title: "Limitations and sources", desc: "What the synthetic data cannot prove, and where every link comes from", href: "/methods" },
        { title: "Research Lab", desc: "Secondary demo: move the sliders, see the simulated model respond", href: "/research" },
      ],
    },
    {
      heading: "Prototype farm app",
      note: "An earlier prototype. Sensor readings are simulated and prices are sample data. Ordering and billing are not connected.",
      rows: [
        { title: "Field dashboard", desc: "Today's soil readings against target ranges, tasks and valve", href: "/field" },
        { title: t("more_weather"), desc: t("more_sub_weather"), href: "/weather" },
        { title: t("more_doctor"), desc: t("more_sub_doctor"), href: "/diagnosis" },
        { title: t("more_journal"), desc: t("more_sub_journal"), href: "/journal" },
        { title: t("more_schemes"), desc: t("more_sub_schemes"), href: "/schemes" },
        { title: t("more_education"), desc: t("more_sub_education"), href: "/education" },
        { title: t("more_drone"), desc: t("more_sub_drone"), href: "/services" },
        { title: t("more_subscription"), desc: t("more_sub_subscription"), href: "/subscription" },
        { title: t("settings_title"), desc: t("more_sub_settings"), href: "/settings" },
      ],
    },
  ];

  return (
    <div className="space-y-12 pb-8">
      <header>
        <h2 className="font-display text-3xl md:text-4xl font-bold">More</h2>
      </header>
      {groups.map((g) => (
        <section key={g.heading} aria-labelledby={g.heading.replace(/\s/g, "-")}>
          <h3 id={g.heading.replace(/\s/g, "-")} className="font-display text-xl font-bold border-b border-foreground pb-2">{g.heading}</h3>
          {g.note && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{g.note}</p>}
          <ul className="divide-y divide-border">
            {g.rows.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="group flex items-center justify-between gap-4 min-h-[60px] py-3">
                  <span>
                    <span className="block text-[15px] font-semibold">{r.title}</span>
                    <span className="block text-sm text-muted-foreground">{r.desc}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-100 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
