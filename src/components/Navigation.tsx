"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity, BookOpen, ChevronDown, CloudSun, FileSpreadsheet, FlaskConical,
  Home, Landmark, Leaf, Menu, Microscope, Settings2, Sprout, Stethoscope,
  TableProperties, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const research = [
  { label: "Project story", href: "/", icon: Home },
  { label: "Dataset", href: "/dataset", icon: FileSpreadsheet },
  { label: "Findings", href: "/findings", icon: Microscope },
  { label: "Research Lab", href: "/research", icon: FlaskConical },
  { label: "Farmer resources", href: "/resources", icon: Landmark },
  { label: "Methods & limits", href: "/methods", icon: BookOpen },
];

const tools = [
  { label: "Field dashboard", href: "/field", icon: Sprout },
  { label: "Advisor", href: "/advisor", icon: Activity },
  { label: "Soil sensors", href: "/sensors", icon: TableProperties },
  { label: "Weather", href: "/weather", icon: CloudSun },
  { label: "Crop diagnosis", href: "/diagnosis", icon: Stethoscope },
  { label: "Market prices", href: "/prices", icon: FileSpreadsheet },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Learning", href: "/education", icon: BookOpen },
  { label: "Schemes & services", href: "/schemes", icon: Wrench },
];

const mobile = [
  { label: "Story", href: "/", icon: Home },
  { label: "Dataset", href: "/dataset", icon: FileSpreadsheet },
  { label: "Findings", href: "/findings", icon: Microscope },
  { label: "Lab", href: "/research", icon: FlaskConical },
  { label: "More", href: "/more", icon: Menu },
];

function active(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname, compact = false }: {
  item: { label: string; href: string; icon: typeof Home };
  pathname: string;
  compact?: boolean;
}) {
  const selected = active(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={selected ? "page" : undefined}
      title={compact ? item.label : undefined}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors duration-100",
        selected
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} aria-hidden />
      <span>{item.label}</span>
      {item.href === "/research" && <span className={cn("ml-auto text-[10px]", selected ? "text-primary-foreground/70" : "text-muted-foreground")}>LAB</span>}
    </Link>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const isToolRoute = tools.some((item) => active(pathname, item.href));

  useEffect(() => {
    if (isToolRoute) setToolsOpen(true);
  }, [isToolRoute]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col border-r border-border bg-sidebar md:flex">
        <Link href="/" className="flex h-[72px] shrink-0 items-center gap-3 border-b border-border px-5" aria-label="AgriSense AI project home">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Leaf className="h-[19px] w-[19px]" strokeWidth={1.8} aria-hidden />
          </span>
          <span className="min-w-0">
            <span translate="no" className="block font-display text-[16px] font-bold tracking-tight">AgriSense AI</span>
            <span className="block text-[11px] text-muted-foreground">Research fieldbook</span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
          <p className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground">THE PROJECT</p>
          <div className="space-y-1">
            {research.map((item) => <NavLink key={item.href} item={item} pathname={pathname} />)}
          </div>

          <div className="my-5 border-t border-border" />
          <button
            type="button"
            aria-expanded={toolsOpen}
            aria-controls="prototype-tools"
            onClick={() => setToolsOpen((open) => !open)}
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Wrench className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} aria-hidden />
            <span className="flex-1">Farm tools</span>
            <span className="rounded-sm border border-border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide">DEMO</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-150", toolsOpen && "rotate-180")} aria-hidden />
          </button>
          {toolsOpen && (
            <div id="prototype-tools" className="mt-1 space-y-1 border-l border-border pl-2 ml-5">
              {tools.map((item) => <NavLink key={item.href} item={item} pathname={pathname} />)}
              <NavLink item={{ label: "More tools", href: "/more", icon: Menu }} pathname={pathname} />
            </div>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Demo readings are simulated. Research data is synthetic.
          </div>
          <NavLink item={{ label: "Settings", href: "/settings", icon: Settings2 }} pathname={pathname} />
        </div>
      </aside>

      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {mobile.map((item) => {
            const selected = item.href === "/more"
              ? pathname === "/more" || (!mobile.some((entry) => entry.href !== "/more" && active(pathname, entry.href)))
              : active(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1 text-[10px] font-medium transition-colors",
                  selected ? "border-foreground text-foreground" : "border-transparent text-muted-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={selected ? 2.2 : 1.8} aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
