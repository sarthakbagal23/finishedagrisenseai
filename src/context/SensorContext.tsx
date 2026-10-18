"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, type TranslationKeys } from '@/lib/translations';

export type SupportedLanguage = 'en' | 'hi' | 'pb' | 'ta' | 'te' | 'mr' | 'kn' | 'bn' | 'gu';

type NutrientLevel = 'High' | 'Medium' | 'Low';

interface SensorData {
  soilMoisture: number;
  soilTemperature: number;
  soilPh: number;
  nutrientLevel: NutrientLevel;
}

interface UserSettings {
  cropType: string;
  farmSize: string;
  location: string;
  language: SupportedLanguage;
  notifications: {
    weather: boolean;
    prices: boolean;
    sensor: boolean;
  };
}

interface SensorContextType {
  sensors: SensorData;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  t: (key: TranslationKeys) => string;
}

const defaultSettings: UserSettings = {
  cropType: 'Rice',
  farmSize: '2.5',
  location: 'Chandigarh, Punjab',
  language: 'en',
  notifications: {
    weather: true,
    prices: true,
    sensor: true,
  },
};

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensors] = useState<SensorData>({
    soilMoisture: 69.4,
    soilTemperature: 24.1,
    soilPh: 6.3,
    nutrientLevel: 'Medium',
  });

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('agrisense_settings');
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return;
      const candidate = parsed as Partial<UserSettings>;
      const language = ['en', 'hi', 'pb', 'ta', 'te', 'mr', 'kn', 'bn', 'gu'].includes(String(candidate.language)) ? candidate.language! : defaultSettings.language;
      setSettings({
        cropType: typeof candidate.cropType === 'string' && candidate.cropType.length < 80 ? candidate.cropType : defaultSettings.cropType,
        farmSize: typeof candidate.farmSize === 'string' && /^\d+(\.\d+)?$/.test(candidate.farmSize) ? candidate.farmSize : defaultSettings.farmSize,
        location: typeof candidate.location === 'string' && candidate.location.length < 120 ? candidate.location : defaultSettings.location,
        language,
        notifications: {
          weather: typeof candidate.notifications?.weather === 'boolean' ? candidate.notifications.weather : defaultSettings.notifications.weather,
          prices: typeof candidate.notifications?.prices === 'boolean' ? candidate.notifications.prices : defaultSettings.notifications.prices,
          sensor: typeof candidate.notifications?.sensor === 'boolean' ? candidate.notifications.sensor : defaultSettings.notifications.sensor,
        },
      });
    } catch {
      try { localStorage.removeItem('agrisense_settings'); } catch { /* Storage may be unavailable. */ }
    }
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try { localStorage.setItem('agrisense_settings', JSON.stringify(updated)); } catch { /* Keep in-memory settings if storage is unavailable. */ }
      return updated;
    });
  };

  const t = useCallback((key: TranslationKeys): string => {
    const lang = settings.language;
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [settings.language]);

  return (
    <SensorContext.Provider value={{ sensors, settings, updateSettings, t }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensors = () => {
  const context = useContext(SensorContext);
  if (!context) throw new Error('useSensors must be used within a SensorProvider');
  return context;
};
