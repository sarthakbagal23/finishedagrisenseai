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
import { MotionConfig } from 'framer-motion';

export const metadata: Metadata = {
  title: { default: 'AgriSense AI · Research fieldbook', template: '%s · AgriSense AI' },
  description: 'Explore a transparent, formula-generated research dataset on soil rigidity and root growth, then follow its limits to trusted farmer resources in India.',
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#f4f3eb" />
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
          <MotionConfig reducedMotion="user">
          <SensorProvider>
            <NotificationProvider>
              <a href="#main" className="skip-link">Skip to content</a>
              <div className="min-h-screen">
                {/* Desktop: sidebar + main content area */}
                <div className="flex min-h-screen">
                  {/* Sidebar — hidden on mobile, visible on md+ */}
                  <Navigation />

                  {/* Main content area */}
                  <div className="flex-1 min-w-0 flex flex-col min-h-screen md:ml-[252px]">
                    <Header />
                    <StatusStrip />
                    <main id="main" className="flex-1 min-w-0 overflow-x-clip px-4 py-6 pb-24 sm:px-6 md:px-8 md:py-8 md:pb-10">
                      <div className="mx-auto w-full max-w-[1480px]">
                      {children}
                      </div>
                    </main>
                  </div>
                </div>
              </div>
              <Toaster />
            </NotificationProvider>
          </SensorProvider>
          </MotionConfig>
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
