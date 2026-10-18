"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, Command, MapPin, Moon, Search, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSensors } from "@/context/SensorContext";
import { useTheme } from "@/context/ThemeContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const TITLES: Record<string, string> = {
  "/": "Project story",
  "/dataset": "Dataset",
  "/findings": "Findings",
  "/resources": "Farmer resources",
  "/methods": "Methods & limits",
  "/research": "Research Lab",
  "/field": "Field dashboard",
  "/advisor": "Farm advisor",
  "/sensors": "Soil readings",
  "/weather": "Weather",
  "/diagnosis": "Crop diagnosis",
  "/prices": "Market prices",
  "/journal": "Field journal",
  "/education": "Learning library",
  "/schemes": "Schemes & services",
  "/services": "Farm services",
  "/subscription": "Plan & access",
  "/settings": "Settings",
  "/more": "More tools",
  "/offline": "You're offline",
};

const PROTOTYPE_ROUTES = ["/field", "/advisor", "/sensors", "/weather", "/diagnosis", "/prices", "/journal", "/education", "/schemes", "/services", "/subscription"];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSensors();
  const { theme, toggleTheme } = useTheme();
  const title = TITLES[pathname] ?? "AgriSense AI";
  const prototype = PROTOTYPE_ROUTES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const routeItems = useMemo(() => Object.entries(TITLES).map(([href, label]) => ({ href, label })), []);
  const filteredItems = routeItems.filter((item) => `${item.label} ${item.href}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!paletteOpen) setQuery("");
  }, [paletteOpen]);

  const goTo = (href: string) => {
    setPaletteOpen(false);
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="flex h-[62px] items-center justify-between gap-4 px-4 md:px-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">AgriSense AI</span>
            <ChevronRight className="hidden h-3 w-3 sm:block" aria-hidden />
            <span className="truncate">{prototype ? "Farm tools · demo" : "Research project"}</span>
          </div>
          <h1 className="mt-0.5 truncate font-display text-[15px] font-semibold leading-tight tracking-[-0.01em]">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Quick navigation" title="Quick navigation (Ctrl+K)"
            className="flex h-11 items-center gap-2 rounded-md px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Search className="h-[17px] w-[17px]" aria-hidden /><span className="hidden md:inline text-xs">Jump to</span><kbd className="hidden lg:inline rounded border border-border px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
          </button>
          {prototype && (
            <div className="hidden items-center gap-1.5 border-r border-border pr-3 mr-1 text-xs text-muted-foreground sm:flex">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              <span className="max-w-36 truncate">{settings.location.split(",")[0]}</span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
          </button>
          <Link
            href="/settings"
            aria-label="Open settings and notifications"
            title="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden />
          </Link>
        </div>
      </div>
      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent className="top-[20%] translate-y-0 p-0 gap-0 overflow-hidden sm:max-w-xl">
          <DialogHeader className="sr-only"><DialogTitle>Quick navigation</DialogTitle><DialogDescription>Search and open a page in AgriSense.</DialogDescription></DialogHeader>
          <div className="flex items-center gap-3 border-b border-border px-4"><Command className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden /><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages…" className="border-0 shadow-none focus-visible:ring-0 h-14" /></div>
          <div className="p-2 max-h-[60vh] overflow-y-auto" role="listbox" aria-label="Pages">
            {filteredItems.length ? filteredItems.map((item) => <button key={item.href} type="button" role="option" aria-selected={item.href === pathname} onClick={() => goTo(item.href)} className="w-full min-h-11 px-3 rounded-md flex items-center justify-between text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"><span>{item.label}</span><span className="text-xs text-muted-foreground">{item.href}</span></button>) : <p className="px-3 py-8 text-center text-sm text-muted-foreground">No matching pages.</p>}
          </div>
          <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Navigate with your keyboard · Esc to close</div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
