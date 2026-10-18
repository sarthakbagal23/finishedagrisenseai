"use client";

import { Bell, ChevronRight, MapPin, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSensors } from "@/context/SensorContext";
import { useTheme } from "@/context/ThemeContext";

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
  const { settings } = useSensors();
  const { theme, toggleTheme } = useTheme();
  const title = TITLES[pathname] ?? "AgriSense AI";
  const prototype = PROTOTYPE_ROUTES.some((path) => pathname === path || pathname.startsWith(`${path}/`));

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
    </header>
  );
}
