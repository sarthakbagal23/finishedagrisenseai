"use client";

import { Bell, MapPin, Leaf, Sun, Moon } from 'lucide-react';
import { useSensors } from '@/context/SensorContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export function Header() {
  const { settings, t } = useSensors();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="h-14 border-b border-border" />;

  const btn = "w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-100";

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-8 h-14 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <Leaf className="md:hidden w-5 h-5 text-accent shrink-0" aria-hidden />
          <div className="min-w-0">
            <h1 className="font-display text-base font-bold leading-tight truncate">{t('header_title')}</h1>
            <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
              <MapPin className="w-3 h-3 shrink-0" aria-hidden />
              <span className="num truncate">{settings.cropType} · {settings.location.split(',')[0]}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <button onClick={toggleTheme} className={btn} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <Link href="/settings" className={btn} aria-label="Notifications and settings">
            <Bell className="w-[18px] h-[18px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
