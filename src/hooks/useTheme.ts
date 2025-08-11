import { useEffect, useCallback } from 'react';
import { useSettings } from '@/context/SettingsContext';

type Theme = 'light' | 'dark' | 'auto';

export const useTheme = () => {
  const { settings, updateSetting } = useSettings();

  // Function to get system theme preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Function to apply theme to document
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  // Function to get effective theme (resolves 'auto' to actual theme)
  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (settings.theme === 'auto') {
      return getSystemTheme();
    }
    return settings.theme as 'light' | 'dark';
  }, [settings.theme, getSystemTheme]);

  // Apply theme whenever settings change
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme();
    applyTheme(effectiveTheme);
  }, [getEffectiveTheme, applyTheme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (settings.theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [settings.theme, getSystemTheme, applyTheme]);

  // Initialize theme on first load
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme();
    applyTheme(effectiveTheme);
  }, [getEffectiveTheme, applyTheme]);

  return {
    theme: settings.theme,
    effectiveTheme: getEffectiveTheme(),
    setTheme: (theme: Theme) => updateSetting('theme', theme),
    systemTheme: getSystemTheme(),
  };
};