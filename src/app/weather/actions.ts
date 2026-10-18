"use server";

import { z } from 'zod';

export interface WeatherDay {
  date: string;
  day: string;
  icon: string;
  high: number;
  low: number;
  rainChance: number;
  rainMm: number;
  et0Mm: number | null;
  condition: string;
}

export interface WeatherData {
  location: string;
  updatedAt: string;
  current: {
    temp: number;
    condition: string;
    icon: string;
    humidity: number;
    windKmh: number;
    visibilityKm: number | null;
  };
  daily: WeatherDay[];
}

const GeocodingSchema = z.object({
  results: z.array(z.object({
    name: z.string(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    country: z.string().optional(),
    admin1: z.string().optional(),
  })).optional(),
});

const ForecastSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number().min(0).max(100),
    weather_code: z.number(),
    wind_speed_10m: z.number().nonnegative(),
    visibility: z.number().nonnegative().optional(),
  }),
  daily: z.object({
    time: z.array(z.string()).min(1).max(7),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_probability_max: z.array(z.number().min(0).max(100).nullable()),
    precipitation_sum: z.array(z.number().nonnegative()),
    et0_fao_evapotranspiration: z.array(z.number().nonnegative()).optional(),
  }),
  timezone: z.string(),
  current_weather_units: z.object({}).optional(),
}).passthrough();

const WEATHER_CODES: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear sky', icon: '☀️' },
  1: { condition: 'Mainly clear', icon: '🌤️' },
  2: { condition: 'Partly cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Fog', icon: '🌫️' },
  48: { condition: 'Rime fog', icon: '🌫️' },
  51: { condition: 'Light drizzle', icon: '🌦️' },
  53: { condition: 'Drizzle', icon: '🌦️' },
  55: { condition: 'Dense drizzle', icon: '🌧️' },
  56: { condition: 'Freezing drizzle', icon: '🌧️' },
  57: { condition: 'Heavy freezing drizzle', icon: '🌧️' },
  61: { condition: 'Light rain', icon: '🌧️' },
  63: { condition: 'Rain', icon: '🌧️' },
  65: { condition: 'Heavy rain', icon: '🌧️' },
  66: { condition: 'Freezing rain', icon: '🌧️' },
  67: { condition: 'Heavy freezing rain', icon: '🌧️' },
  71: { condition: 'Light snow', icon: '🌨️' },
  73: { condition: 'Snow', icon: '🌨️' },
  75: { condition: 'Heavy snow', icon: '❄️' },
  77: { condition: 'Snow grains', icon: '❄️' },
  80: { condition: 'Light showers', icon: '🌦️' },
  81: { condition: 'Showers', icon: '🌧️' },
  82: { condition: 'Heavy showers', icon: '🌧️' },
  85: { condition: 'Snow showers', icon: '🌨️' },
  86: { condition: 'Heavy snow showers', icon: '❄️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm with hail', icon: '⛈️' },
  99: { condition: 'Heavy thunderstorm with hail', icon: '⛈️' },
};

function getWeatherCode(code: number) {
  return WEATHER_CODES[code] ?? { condition: 'Conditions unavailable', icon: '—' };
}

function requireOk(response: Response, label: string) {
  if (!response.ok) throw new Error(`${label} unavailable`);
}

async function loadWeatherForecast(locationInput: string): Promise<WeatherData> {
  const query = locationInput.trim().slice(0, 100);
  if (query.length < 2) throw new Error('Add a town or district in farm settings to view the forecast.');

  const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geoUrl.search = new URLSearchParams({ name: query, count: '1', language: 'en', format: 'json', countryCode: 'IN' }).toString();
  const geoResponse = await fetch(geoUrl, { signal: AbortSignal.timeout(8_000), next: { revalidate: 86_400 } });
  requireOk(geoResponse, 'Location lookup');
  const geocoding = GeocodingSchema.safeParse(await geoResponse.json());
  const place = geocoding.success ? geocoding.data.results?.[0] : undefined;
  if (!place) throw new Error(`No forecast location found for “${query}”. Update your town or district in settings.`);

  const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
  forecastUrl.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,et0_fao_evapotranspiration',
    forecast_days: '7',
    timezone: 'auto',
    wind_speed_unit: 'kmh',
  }).toString();
  const forecastResponse = await fetch(forecastUrl, { signal: AbortSignal.timeout(8_000), next: { revalidate: 900 } });
  requireOk(forecastResponse, 'Weather forecast');
  const forecast = ForecastSchema.safeParse(await forecastResponse.json());
  if (!forecast.success) throw new Error('The weather provider returned incomplete data. Try again shortly.');

  const { current, daily, timezone } = forecast.data;
  const seriesLength = Math.min(
    daily.time.length,
    daily.weather_code.length,
    daily.temperature_2m_max.length,
    daily.temperature_2m_min.length,
    daily.precipitation_probability_max.length,
    daily.precipitation_sum.length,
  );
  if (seriesLength < 1) throw new Error('No forecast days are available for this location.');

  const today = daily.time[0];
  const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' });
  const dailyItems: WeatherDay[] = Array.from({ length: seriesLength }, (_, index) => {
    const code = getWeatherCode(daily.weather_code[index]);
    const date = daily.time[index];
    const dayLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : fmt.format(new Date(`${date}T12:00:00Z`));
    return {
      date,
      day: dayLabel,
      icon: code.icon,
      condition: code.condition,
      high: Math.round(daily.temperature_2m_max[index]),
      low: Math.round(daily.temperature_2m_min[index]),
      rainChance: daily.precipitation_probability_max[index] ?? 0,
      rainMm: Math.round(daily.precipitation_sum[index] * 10) / 10,
      et0Mm: daily.et0_fao_evapotranspiration?.[index] == null
        ? null
        : Math.round(daily.et0_fao_evapotranspiration[index] * 10) / 10,
    };
  });

  const currentCode = getWeatherCode(current.weather_code);
  return {
    location: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
    updatedAt: new Date().toISOString(),
    current: {
      temp: Math.round(current.temperature_2m),
      condition: currentCode.condition,
      icon: currentCode.icon,
      humidity: Math.round(current.relative_humidity_2m),
      windKmh: Math.round(current.wind_speed_10m),
      visibilityKm: current.visibility == null ? null : Math.round((current.visibility / 1000) * 10) / 10,
    },
    daily: dailyItems,
  };
}

export type WeatherResult = { ok: true; data: WeatherData } | { ok: false; error: string };

/** Returns a result instead of throwing: production Next.js masks thrown server-action messages. */
export async function getWeatherForecast(locationInput: string): Promise<WeatherResult> {
  try {
    return { ok: true, data: await loadWeatherForecast(locationInput) };
  } catch (cause) {
    const name = cause instanceof Error ? cause.name : '';
    const offline = name === 'TypeError' || name === 'TimeoutError' || name === 'AbortError';
    return {
      ok: false,
      error: offline
        ? 'The forecast service could not be reached. Check your connection and try again.'
        : cause instanceof Error ? cause.message : 'Weather is unavailable for this location.',
    };
  }
}
