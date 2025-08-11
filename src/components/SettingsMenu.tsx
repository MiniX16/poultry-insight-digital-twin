import React from 'react';
import { Settings, RefreshCw, Clock, Palette, Thermometer, Bell, RotateCcw } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const SettingsMenu: React.FC = () => {
  const { settings, updateSetting, resetSettings } = useSettings();

  // Helper function to format refresh interval display
  const formatRefreshInterval = (seconds: number): string => {
    if (seconds >= 60) {
      const minutes = seconds / 60;
      return minutes === 1 ? '1 min' : `${minutes} min`;
    }
    return `${seconds}s`;
  };

  const refreshIntervalOptions = [
    { value: 15, label: '15 segundos' },
    { value: 30, label: '30 segundos' },
    { value: 60, label: '1 minuto' },
    { value: 120, label: '2 minutos' },
    { value: 300, label: '5 minutos' },
    { value: 600, label: '10 minutos' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'auto', label: 'Automático' },
  ];

  const temperatureUnitOptions = [
    { value: 'celsius', label: 'Celsius (°C)' },
    { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configuración</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configuración
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Refresh Interval */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Actualización</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatRefreshInterval(settings.refreshInterval)}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              Intervalo de actualización
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {refreshIntervalOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => updateSetting('refreshInterval', option.value)}
                className={settings.refreshInterval === option.value ? 'bg-accent' : ''}
              >
                {option.label}
                {settings.refreshInterval === option.value && (
                  <span className="ml-auto">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Theme */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Tema</span>
            <span className="ml-auto text-xs text-muted-foreground capitalize">
              {settings.theme === 'auto' ? 'Auto' : settings.theme === 'light' ? 'Claro' : 'Oscuro'}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs">
              <Palette className="h-3 w-3" />
              Apariencia
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {themeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => updateSetting('theme', option.value as 'light' | 'dark' | 'auto')}
                className={settings.theme === option.value ? 'bg-accent' : ''}
              >
                {option.label}
                {settings.theme === option.value && (
                  <span className="ml-auto">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Temperature Unit */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            <span>Temperatura</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {settings.temperatureUnit === 'celsius' ? '°C' : '°F'}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs">
              <Thermometer className="h-3 w-3" />
              Unidad de temperatura
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {temperatureUnitOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => updateSetting('temperatureUnit', option.value as 'celsius' | 'fahrenheit')}
                className={settings.temperatureUnit === option.value ? 'bg-accent' : ''}
              >
                {option.label}
                {settings.temperatureUnit === option.value && (
                  <span className="ml-auto">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Toggle Settings */}
        <DropdownMenuItem className="flex items-center justify-between" onClick={() => updateSetting('notifications', !settings.notifications)}>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notificaciones</span>
          </div>
          <Switch checked={settings.notifications} />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Reset Settings */}
        <DropdownMenuItem onClick={resetSettings} className="text-destructive focus:text-destructive">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>Restablecer configuración</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsMenu;