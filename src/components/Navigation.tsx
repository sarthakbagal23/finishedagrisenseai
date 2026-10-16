"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home, Activity, Brain, LayoutGrid, TrendingUp, Microscope,
  ChevronLeft, Leaf, Settings, Cloud, ShieldCheck,
  BookOpen, FileText, Landmark, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSensors } from '@/context/SensorContext';

export function Navigation() {
  const pathname = usePathname();
  const { t } = useSensors();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('agrisense_sidebar_collapsed');
    if (saved) setCollapsed(saved === 'true');
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('agrisense_sidebar_collapsed', String(next));
  };

  const primaryNav = [
    { label: t('nav_home'), icon: Home, href: '/' },
    { label: t('nav_advisor'), icon: Brain, href: '/advisor' },
    { label: t('nav_sensors'), icon: Activity, href: '/sensors' },
    { label: t('nav_market'), icon: TrendingUp, href: '/prices' },
    { label: t('nav_more'), icon: LayoutGrid, href: '/more' },
  ];

  const secondaryNav = [
    { label: 'Research Lab', icon: Microscope, href: '/research' },
    { label: 'Weather', icon: Cloud, href: '/weather' },
    { label: 'Diagnosis', icon: ShieldCheck, href: '/diagnosis' },
    { label: 'Journal', icon: FileText, href: '/journal' },
    { label: 'Schemes', icon: Landmark, href: '/schemes' },
    { label: 'Education', icon: BookOpen, href: '/education' },
    { label: 'Data & Methods', icon: Info, href: '/methods' },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  if (!mounted) return null;

  const link = (item: { label: string; href: string }) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={isActive(item.href) ? 'page' : undefined}
      title={item.label}
      className={cn(
        "flex items-center h-9 text-[14px] transition-colors duration-100 border-l-2",
        collapsed ? "justify-center px-0" : "px-4",
        isActive(item.href)
          ? "border-foreground text-foreground font-semibold"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {collapsed ? <span className="font-display text-sm font-bold">{item.label.slice(0, 1)}</span> : item.label}
    </Link>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-sidebar border-r border-border transition-[width] duration-[280ms] ease-calm",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <div className={cn("flex items-center gap-2.5 h-16 border-b border-border shrink-0", collapsed ? "justify-center" : "px-5")}>
          <Leaf className="w-5 h-5 text-accent shrink-0" strokeWidth={2} aria-hidden />
          {!collapsed && <span className="font-display text-lg font-bold">AgriSense</span>}
        </div>

        <nav className="flex-1 py-5 overflow-y-auto" aria-label="Primary">
          {!collapsed && <p className="px-5 mb-1 text-xs font-semibold text-muted-foreground">Field</p>}
          {primaryNav.map(link)}
          <div className="my-4 mx-5 gold-line" />
          {!collapsed && <p className="px-5 mb-1 text-xs font-semibold text-muted-foreground">Tools</p>}
          {secondaryNav.map(link)}
        </nav>

        <div className="border-t border-border py-2">
          {link({ label: 'Settings', href: '/settings' })}
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn("flex items-center gap-2 h-9 w-full text-[14px] text-muted-foreground hover:text-foreground border-l-2 border-transparent", collapsed ? "justify-center" : "px-4")}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-[280ms] ease-calm", collapsed && "rotate-180")} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <nav aria-label="Primary" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-stretch max-w-lg mx-auto">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] border-t-2 text-[11px]",
                isActive(item.href) ? "border-foreground text-foreground font-semibold" : "border-transparent text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={isActive(item.href) ? 2.4 : 1.8} aria-hidden />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
