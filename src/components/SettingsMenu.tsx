import React, { useState } from 'react';
import { Settings, RefreshCw, Clock, Palette, Bell, RotateCcw, AlertTriangle, Thermometer, Zap } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SettingsMenu: React.FC = () => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false);
  const [isThermalRangeOpen, setIsThermalRangeOpen] = useState(false);
  const [isElectricityRateOpen, setIsElectricityRateOpen] = useState(false);
  const [tempThresholds, setTempThresholds] = useState(settings.notificationThresholds);
  const [tempThermalRange, setTempThermalRange] = useState(settings.thermalMapRange);
  const [tempElectricityRate, setTempElectricityRate] = useState(settings.electricityRate);

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

  const handleThresholdsUpdate = () => {
    updateSetting('notificationThresholds', tempThresholds);
    setIsThresholdsOpen(false);
  };

  const handleThermalRangeUpdate = () => {
    updateSetting('thermalMapRange', tempThermalRange);
    setIsThermalRangeOpen(false);
  };

  const handleElectricityRateUpdate = () => {
    updateSetting('electricityRate', tempElectricityRate);
    setIsElectricityRateOpen(false);
  };

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

        <DropdownMenuSeparator />

        {/* Toggle Settings */}
        <DropdownMenuItem className="flex items-center justify-between" onClick={() => updateSetting('notifications', !settings.notifications)}>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notificaciones</span>
          </div>
          <Switch checked={settings.notifications} />
        </DropdownMenuItem>

        {/* Notification Thresholds */}
        {settings.notifications && (
          <Dialog open={isThresholdsOpen} onOpenChange={setIsThresholdsOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => {
                setTempThresholds(settings.notificationThresholds);
                setIsThresholdsOpen(true);
              }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Configurar Umbrales</span>
                </div>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Umbrales de Notificación</DialogTitle>
                <DialogDescription>
                  Configura los rangos para recibir alertas de factores ambientales
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Temperature */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Temperatura (°C)</Label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Mínimo</Label>
                      <Input
                        type="number"
                        value={tempThresholds.temperature.min}
                        onChange={(e) => setTempThresholds(prev => ({
                          ...prev,
                          temperature: { ...prev.temperature, min: Number(e.target.value) }
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Máximo</Label>
                      <Input
                        type="number"
                        value={tempThresholds.temperature.max}
                        onChange={(e) => setTempThresholds(prev => ({
                          ...prev,
                          temperature: { ...prev.temperature, max: Number(e.target.value) }
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Humidity */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Humedad (%)</Label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Mínimo</Label>
                      <Input
                        type="number"
                        value={tempThresholds.humidity.min}
                        onChange={(e) => setTempThresholds(prev => ({
                          ...prev,
                          humidity: { ...prev.humidity, min: Number(e.target.value) }
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Máximo</Label>
                      <Input
                        type="number"
                        value={tempThresholds.humidity.max}
                        onChange={(e) => setTempThresholds(prev => ({
                          ...prev,
                          humidity: { ...prev.humidity, max: Number(e.target.value) }
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* CO2 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">CO₂ (ppm)</Label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Mínimo</Label>
                      <Input
                        type="number"
                        value={tempThresholds.co2.min}
                        onChange={(e) => setTempThresholds(prev => ({
                          ...prev,
                          co2: { ...prev.co2, min: Number(e.target.value) }
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Máximo</Label>
                      <Input
                        type="number"
                        value={tempThresholds.co2.max}
                        onChange={(e) => setTempThresholds(prev => ({
                          ...prev,
                          co2: { ...prev.co2, max: Number(e.target.value) }
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* NH3 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">NH₃ (ppm)</Label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Mínimo</Label>
                      <Input
                        type="number"
                        value={tempThresholds.nh3.min}
                        onChange={(e) => setTempThresholds(prev => ({
                          ...prev,
                          nh3: { ...prev.nh3, min: Number(e.target.value) }
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Máximo</Label>
                      <Input
                        type="number"
                        value={tempThresholds.nh3.max}
                        onChange={(e) => setTempThresholds(prev => ({
                          ...prev,
                          nh3: { ...prev.nh3, max: Number(e.target.value) }
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsThresholdsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleThresholdsUpdate}>
                  Guardar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Electricity Rate */}
        <Dialog open={isElectricityRateOpen} onOpenChange={setIsElectricityRateOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => {
              setTempElectricityRate(settings.electricityRate);
              setIsElectricityRateOpen(true);
            }}>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Tarifa Eléctrica</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  €{settings.electricityRate}/kWh
                </span>
              </div>
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tarifa Eléctrica</DialogTitle>
              <DialogDescription>
                Configura el precio por kWh para calcular costos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Precio por kWh (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tempElectricityRate}
                  onChange={(e) => setTempElectricityRate(Number(e.target.value))}
                  placeholder="0.15"
                />
                <p className="text-xs text-muted-foreground">
                  Este valor se usa para calcular el costo estimado de electricidad
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsElectricityRateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleElectricityRateUpdate}>
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Thermal Map Range */}
        <Dialog open={isThermalRangeOpen} onOpenChange={setIsThermalRangeOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => {
              setTempThermalRange(settings.thermalMapRange);
              setIsThermalRangeOpen(true);
            }}>
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                <span>Mapa Térmico</span>
              </div>
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rango del Mapa Térmico</DialogTitle>
              <DialogDescription>
                Configura los valores de temperatura para los colores azul y rojo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rango de Temperatura (°C)</Label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Mínimo (Azul)</Label>
                    <Input
                      type="number"
                      value={tempThermalRange.minTemp}
                      onChange={(e) => setTempThermalRange(prev => ({
                        ...prev,
                        minTemp: Number(e.target.value)
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Máximo (Rojo)</Label>
                    <Input
                      type="number"
                      value={tempThermalRange.maxTemp}
                      onChange={(e) => setTempThermalRange(prev => ({
                        ...prev,
                        maxTemp: Number(e.target.value)
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  El azul representa temperaturas ≤ mínimo, el rojo representa temperaturas ≥ máximo
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsThermalRangeOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleThermalRangeUpdate}>
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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