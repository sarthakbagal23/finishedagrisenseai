import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';
import { SensorProvider } from '@/context/SensorContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import Script from 'next/script';
import { StatusStrip } from '@/components/StatusStrip';

export const metadata: Metadata = {
  title: 'AgriSense AI',
  description: 'A climate data science project on drought, soil hardening and root growth, with trusted farmer resources for India.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgriSense AI',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('agrisense_theme');if(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)t='dark';if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}" }} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#f6f4ee" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231a1f17'/%3E%3Cpath d='M46 14C28 16 16 28 13 42c11-5 20-14 25-26-4 14-13 25-25 33' stroke='%23f6f4ee' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"
        />
      </head>
      <body
        className="font-body antialiased bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SensorProvider>
            <NotificationProvider>
              <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md">Skip to content</a>
              <div className="min-h-screen">
                {/* Desktop: sidebar + main content area */}
                <div className="flex min-h-screen">
                  {/* Sidebar — hidden on mobile, visible on md+ */}
                  <Navigation />

                  {/* Main content area */}
                  <div className="flex-1 min-w-0 flex flex-col min-h-screen md:ml-[72px] lg:ml-[260px] ">
                    <Header />
                    <StatusStrip />
                    <main id="main" className="flex-1 min-w-0 overflow-x-clip px-4 md:px-8 py-6 pb-24 md:pb-8 max-w-6xl w-full mx-auto">
                      {children}
                    </main>
                  </div>
                </div>
              </div>
              <Toaster />
            </NotificationProvider>
          </SensorProvider>
        </ThemeProvider>

        {/* Register Service Worker */}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
              try {
                const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
                console.log('[SW] Registered:', reg.scope);

                reg.addEventListener('updatefound', () => {
                  const newWorker = reg.installing;
                  if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                      }
                    });
                  }
                });

                if (reg.active) {
                  const routes = ['/', '/advisor', '/diagnosis', '/sensors', '/prices',
                    '/weather', '/schemes', '/journal', '/more', '/settings', '/education', '/services', '/subscription', '/research', '/methods', '/dataset', '/findings', '/resources', '/field'];
                  const cache = await caches.open('agrisense-v3-static');
                  await Promise.allSettled(
                    routes.map(async route => {
                      const existing = await cache.match(route);
                      if (!existing) {
                        try {
                          const res = await fetch(route);
                          if (res.ok) await cache.put(route, res);
                        } catch (_) {}
                      }
                    })
                  );
                }
              } catch (err) {
                console.warn('[SW] Registration failed:', err);
              }
            });

            navigator.serviceWorker.addEventListener('controllerchange', () => {
              window.location.reload();
            });
          }
        `}</Script>
      </body>
    </html>
  );
}
