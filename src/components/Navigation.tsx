"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home, Activity, Brain, LayoutGrid, TrendingUp, Microscope,
  ChevronLeft, Leaf, Settings, Cloud, ShieldCheck,
  BookOpen, FileText, Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSensors } from '@/context/SensorContext';
import { motion } from 'framer-motion';

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
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  if (!mounted) return null;

  return (
    <>
      {/* ═══ Desktop Sidebar ═══ */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-[#0E120B] border-r border-border transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Logo area */}
        <div className={cn(
          "flex items-center gap-3 px-5 h-16 border-b border-border shrink-0",
          collapsed && "justify-center px-0"
        )}>
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 shadow-glow">
            <Leaf className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-display text-lg font-bold tracking-tight text-foreground"
            >
              AgriSense
            </motion.span>
          )}
        </div>

        {/* Primary nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className={cn(
            "text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2",
            collapsed ? "text-center" : "px-3"
          )}>
            {collapsed ? "—" : "Main"}
          </p>
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                collapsed && "justify-center px-0"
              )}
            >
              {/* Active indicator bar */}
              {isActive(item.href) && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive(item.href) && "text-primary")} strokeWidth={isActive(item.href) ? 2.5 : 1.8} />
              {!collapsed && (
                <span className="text-[13px] font-medium tracking-tight">{item.label}</span>
              )}
            </Link>
          ))}

          {/* Separator */}
          <div className={cn("my-4", collapsed ? "mx-2" : "mx-3")}>
            <div className="gold-line" />
          </div>

          <p className={cn(
            "text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2",
            collapsed ? "text-center" : "px-3"
          )}>
            {collapsed ? "—" : "Tools"}
          </p>
          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive(item.href) && "text-primary")} strokeWidth={isActive(item.href) ? 2.5 : 1.8} />
              {!collapsed && (
                <span className="text-[13px] font-medium tracking-tight">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Collapse toggle + settings */}
        <div className="border-t border-border p-3 space-y-1">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              isActive('/settings')
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              collapsed && "justify-center px-0"
            )}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
            {!collapsed && <span className="text-[13px] font-medium tracking-tight">Settings</span>}
          </Link>
          <button
            onClick={toggleCollapse}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full text-muted-foreground hover:text-foreground hover:bg-secondary",
              collapsed && "justify-center px-0"
            )}
          >
            <ChevronLeft className={cn("w-[18px] h-[18px] shrink-0 transition-transform duration-300", collapsed && "rotate-180")} strokeWidth={1.8} />
            {!collapsed && <span className="text-[13px] font-medium tracking-tight">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ═══ Mobile Bottom Navigation ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0E120B]/95 backdrop-blur-xl border-t border-border">
        <div className="flex justify-around items-center py-2 px-1 max-w-lg mx-auto">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative",
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={isActive(item.href) ? 2.5 : 2} />
              <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
              {isActive(item.href) && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute -top-0.5 w-5 h-[2px] bg-primary rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}