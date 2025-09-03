import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsState {
  refreshInterval: number; // in seconds
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  notificationThresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
    co2: { min: number; max: number };
    nh3: { min: number; max: number };
  };
  thermalMapRange: {
    minTemp: number; // °C for blue color
    maxTemp: number; // °C for red color
  };
  electricityRate: number; // €/kWh
}

interface SettingsContextType {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsState = {
  refreshInterval: 60, // 60 seconds default
  theme: 'auto',
  notifications: true,
  notificationThresholds: {
    temperature: { min: 18, max: 35 }, // °C
    humidity: { min: 50, max: 75 }, // %
    co2: { min: 0, max: 3000 }, // ppm
    nh3: { min: 0, max: 25 }, // ppm
  },
  thermalMapRange: {
    minTemp: 15, // °C for blue color
    maxTemp: 40, // °C for red color
  },
  electricityRate: 0.15, // €/kWh default
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pollos-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({ ...prevSettings, ...parsedSettings }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pollos-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(
    key: K, 
    value: SettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('pollos-settings');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};