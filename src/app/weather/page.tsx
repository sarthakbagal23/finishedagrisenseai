"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, CloudRain, Droplets, ExternalLink, Eye, LoaderCircle, MapPin, RefreshCw, Wind } from 'lucide-react';
import { useSensors } from '@/context/SensorContext';
import { Button } from '@/components/ui/button';
import { getWeatherForecast, type WeatherData, type WeatherDay } from './actions';
import { cn } from '@/lib/utils';

function planningSignal(day: WeatherDay) {
  if (day.rainChance >= 60 || day.rainMm >= 10) {
    return {
      title: 'Rain is in the forecast',
      body: `Forecast: ${day.rainChance}% precipitation probability and ${day.rainMm} mm. Check drainage and the local district bulletin before time-sensitive field work.`,
    };
  }
  if (day.et0Mm != null) {
    return {
      title: 'Compare weather demand with the field',
      body: `Reference ET₀ is ${day.et0Mm} mm for this day. It is a weather-based reference estimate, not an irrigation prescription; compare it with crop stage and a field soil check.`,
    };
  }
  return {
    title: 'No strong rain signal in this forecast',
    body: 'Use the crop stage and an on-field soil check to plan irrigation. Forecast conditions alone do not show how much water the root zone needs.',
  };
}

export default function WeatherForecast() {
  const { settings } = useSensors();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWeatherForecast(settings.location);
      setWeather(result);
      setSelectedDate(result.daily[0]?.date ?? '');
    } catch (cause) {
      setWeather(null);
      setError(cause instanceof Error ? cause.message : 'Weather is unavailable for this location.');
    } finally {
      setLoading(false);
    }
  }, [settings.location]);

  useEffect(() => { void refresh(); }, [refresh]);

  const selectedDay = useMemo(
    () => weather?.daily.find(day => day.date === selectedDate) ?? weather?.daily[0] ?? null,
    [weather, selectedDate],
  );
  const signal = selectedDay ? planningSignal(selectedDay) : null;

  return (
    <div className="space-y-7 md:space-y-9">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{weather?.location ?? settings.location}</div>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Weather for field planning</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A location-matched forecast with rainfall and reference evapotranspiration. Use it alongside field observations and local advisories.</p>
        </div>
        <Button variant="outline" className="min-h-11 gap-2" onClick={() => void refresh()} disabled={loading}>
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh forecast
        </Button>
      </header>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-warn/30 bg-warn/10 p-4" role="alert">
          <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" /><p className="text-sm text-foreground">{error}</p></div>
          <Button variant="outline" size="sm" className="min-h-10" onClick={() => void refresh()} disabled={loading}>Try again</Button>
        </div>
      )}

      {loading && !weather ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]" aria-busy="true" aria-label="Loading forecast">
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/50" />
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/50" />
        </div>
      ) : weather ? (
        <>
          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-7">
              <div aria-hidden className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-model/10" />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current conditions · {weather.location}</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{weather.current.condition}</p>
                  </div>
                  <span className="text-5xl" aria-hidden>{weather.current.icon}</span>
                </div>
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <p className="font-display text-7xl font-semibold leading-none tracking-tight text-foreground">{weather.current.temp}<span className="text-4xl">°C</span></p>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground"><Droplets className="h-4 w-4 text-model" />{weather.current.humidity}% humidity</p>
                    <p className="flex items-center gap-2 text-muted-foreground"><Wind className="h-4 w-4 text-model" />{weather.current.windKmh} km/h wind</p>
                    <p className="flex items-center gap-2 text-muted-foreground"><Eye className="h-4 w-4 text-model" />{weather.current.visibilityKm == null ? '—' : `${weather.current.visibilityKm} km`} visibility</p>
                    <p className="flex items-center gap-2 text-muted-foreground"><CloudRain className="h-4 w-4 text-model" />{weather.daily[0]?.rainChance ?? 0}% rain chance</p>
                  </div>
                </div>
                <p className="border-t border-border pt-3 text-xs text-muted-foreground">Retrieved {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(weather.updatedAt))} · forecast models can change</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan with context</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">{signal?.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{signal?.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href="https://mausam.imd.gov.in/imd_latest/contents/agromet/advisory/englishstate_current.php" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Check IMD agromet bulletin <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Forecast source <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </section>

          <section aria-labelledby="forecast-days">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 id="forecast-days" className="font-display text-xl font-semibold text-foreground">Choose a day</h3>
                <p className="mt-1 text-sm text-muted-foreground">Select a forecast to inspect rain and reference water demand.</p>
              </div>
              <span className="text-xs text-muted-foreground">7-day forecast · {weather.location}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {weather.daily.map(day => (
                <button type="button" key={day.date} aria-pressed={selectedDate === day.date} onClick={() => setSelectedDate(day.date)}
                  className={cn('min-h-[132px] rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedDate === day.date ? 'border-model bg-model/10' : 'border-border bg-card hover:border-model/40')}>
                  <span className="block text-xs font-semibold text-muted-foreground">{day.day}</span>
                  <span className="mt-2 block text-2xl" aria-hidden>{day.icon}</span>
                  <span className="mt-2 block text-sm font-semibold text-foreground">{day.high}° <span className="font-normal text-muted-foreground">{day.low}°</span></span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CloudRain className="h-3 w-3 text-model" />{day.rainChance}% · {day.rainMm} mm</span>
                </button>
              ))}
            </div>
          </section>

          {selectedDay && (
            <section className="grid gap-4 rounded-2xl border border-border bg-background p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6" aria-live="polite">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected forecast · {selectedDay.day}</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-foreground">{selectedDay.condition}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{signal?.body}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-3 border-t border-border pt-4 text-sm md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <span className="text-muted-foreground">High / low</span><strong className="text-right font-semibold text-foreground">{selectedDay.high}° / {selectedDay.low}°C</strong>
                <span className="text-muted-foreground">Rain chance</span><strong className="text-right font-semibold text-foreground">{selectedDay.rainChance}%</strong>
                <span className="text-muted-foreground">Forecast rain</span><strong className="text-right font-semibold text-foreground">{selectedDay.rainMm} mm</strong>
                <span className="text-muted-foreground">Reference ET₀</span><strong className="text-right font-semibold text-foreground">{selectedDay.et0Mm == null ? '—' : `${selectedDay.et0Mm} mm`}</strong>
              </div>
            </section>
          )}

          <p className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            <ArrowUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-model" />
            Forecasts are model estimates, not field measurements. ET₀ is a reference measure of atmospheric demand, not a crop-specific irrigation amount. Confirm high-impact decisions with local IMD advisories and field observations.
          </p>
        </>
      ) : null}
    </div>
  );
}
