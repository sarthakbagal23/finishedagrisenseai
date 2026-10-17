import { ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Farmer resources in India · AgriSense" };

const RESOURCES = [
  {
    name: "IMD Agromet Advisory Services",
    by: "India Meteorological Department",
    href: "https://mausam.imd.gov.in/responsive/agromet_adv_ser_district_level_wx_forecast.php",
    use: "Check this first for the next few days of weather in your district, and for crop advisories written for farmers.",
    has: ["District-level weather forecast, selectable by state", "District and state agromet bulletins, current and past, in English and local-language versions", "National bulletins and special agromet advisories"],
    note: "The page does not say which local languages are available. Check your state's bulletin.",
  },
  {
    name: "Krishi Vigyan Kendras (KVKs)",
    by: "Indian Council of Agricultural Research (ICAR)",
    href: "https://icar.org.in/index.php/en/krishi-vigyan-kendras-kvks",
    use: "Go to your district's KVK for training, demonstrations and advice on soil, water and crops that fits local conditions.",
    has: ["District-level centres linking research to farmers through training, demonstrations and advisory services", "The ICAR page reports 731 KVKs across 638 rural districts"],
    note: "That ICAR page explains what KVKs do but does not list individual centres. To find yours, search for your district's name with “Krishi Vigyan Kendra”.",
  },
];

export default function Resources() {
  return (
    <div className="space-y-14 pb-8">
      <header className="max-w-3xl">
        <h2 className="font-display text-3xl md:text-5xl font-bold text-balance">For decisions today</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Our dataset is simulated, so nothing on this site should decide when you water, plant or spend money. These two official services can.
        </p>
      </header>

      <ol className="border-t border-foreground divide-y divide-border">
        {RESOURCES.map((r, i) => (
          <li key={r.name} className="grid gap-x-10 gap-y-4 py-8 lg:grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)]">
            <span className="font-display text-4xl md:text-5xl font-bold text-muted-foreground num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="font-display text-2xl font-bold">{r.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{r.by}</p>
              <p className="mt-3 text-[15px] max-w-md">{r.use}</p>
              <a href={r.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 min-h-11 font-semibold underline underline-offset-4">
                Open the official page <ExternalLink className="w-4 h-4" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
            <div>
              <p className="font-semibold text-sm">What is there</p>
              <ul className="mt-1 list-disc pl-5 space-y-1 text-[15px] text-muted-foreground">
                {r.has.map((h) => <li key={h}>{h}</li>)}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground border-l-2 border-border pl-3">{r.note}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="grid gap-8 lg:grid-cols-2 max-w-5xl">
        <div>
          <h3 className="font-display text-xl font-bold">How this connects to our research</h3>
          <p className="mt-2 text-[15px] text-muted-foreground">If our simulation points at anything, it is that soil compaction deserves a measurement. A KVK can test your soil, and an IMD bulletin tells you what rain is coming. That is real evidence for a real field, which our synthetic data is not.</p>
        </div>
        <div>
          <h3 className="font-display text-xl font-bold">Checked and dated</h3>
          <p className="mt-2 text-[15px] text-muted-foreground num">Both links were opened and read on 17 October 2026. Pages change, so confirm details on the official site. We list no phone numbers or contacts here because we have not verified any.</p>
          <p className="mt-2 text-sm"><Link href="/methods" className="underline underline-offset-4 font-semibold">All sources and limitations</Link></p>
        </div>
      </section>
    </div>
  );
}
