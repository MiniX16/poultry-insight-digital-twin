import React, { useEffect, useState } from 'react';
import { useLote } from '@/context/LoteContext';
import { useNotifications } from '@/context/NotificationContext';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';

interface EnvironmentalReadings {
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  nh3: number | null;
  iluminacion: number | null;
}

const EnvironmentalFactors = () => {
  const [readings, setReadings] = useState<EnvironmentalReadings>({
    temperature: null,
    humidity: null,
    co2: null,
    nh3: null,
    iluminacion: null
  });
  const { currentLote } = useLote();
  const { checkThresholds } = useNotifications();
  const { settings } = useSettings();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentLote) return;
      try {
        const data = await medicionAmbientalService.getUltimaMedicionByLote(currentLote.lote_id);
        const newReadings = {
          temperature: data.temperatura,
          humidity: data.humedad,
          co2: data.co2,
          nh3: data.amoniaco,
          iluminacion: data.iluminacion
        };
        setReadings(newReadings);
        
        // Check thresholds for notifications
        if (settings.notifications) {
          checkThresholds({
            temperature: newReadings.temperature,
            humidity: newReadings.humidity,
            co2: newReadings.co2,
            nh3: newReadings.nh3
          });
        }
      } catch (error) {
        console.error('Error fetching environmental data:', error);
      }
    };

    fetchData();
    
    // Set up interval to check environmental data
    const intervalId = setInterval(fetchData, settings.refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [currentLote, settings.refreshInterval, settings.notifications, checkThresholds]);

  // Define rangos usando la configuración de umbrales
  const getStatusColor = (type: keyof EnvironmentalReadings) => {
    const value = readings[type];
    if (value === null) return 'bg-gray-200';

    // Use settings thresholds for monitored environmental factors
    const thresholdTypes: { [key in keyof EnvironmentalReadings]?: keyof typeof settings.notificationThresholds } = {
      temperature: 'temperature',
      humidity: 'humidity',
      co2: 'co2',
      nh3: 'nh3'
    };

    const thresholdType = thresholdTypes[type];
    
    if (thresholdType) {
      const threshold = settings.notificationThresholds[thresholdType];
      
      // Check if value is outside the configured thresholds
      if (value < threshold.min || value > threshold.max) {
        return 'bg-red-400';
      }
      return 'bg-green-400';
    }

    // Fallback for iluminacion (not in notification thresholds)
    if (type === 'iluminacion') {
      const iluminacionRange = { min: 20, max: 50 };
      if (value < iluminacionRange.min || value > iluminacionRange.max) {
        return 'bg-red-400';
      }
      return 'bg-green-400';
    }

    return 'bg-gray-200';
  };

  const renderRow = (label: string, key: keyof EnvironmentalReadings, unit: string = '') => (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center space-x-2">
        <span className="text-2xl font-bold">
          {readings[key] !== null ? `${readings[key]?.toFixed(1)}${unit}` : 'N/A'}
        </span>
        <div className={`w-3 h-3 rounded-full ${getStatusColor(key)}`} />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Factores Ambientales</CardTitle>
        <CardDescription>Lecturas en tiempo real</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderRow("Temperatura", "temperature", "°C")}
          {renderRow("Humedad", "humidity", "%")}
          {renderRow("CO₂", "co2", " ppm")}
          {renderRow("NH₃", "nh3", " ppm")}
          {renderRow("Iluminación", "iluminacion", " lx")}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvironmentalFactors;
