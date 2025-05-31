import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';
import { loteService } from '@/lib/services/loteService';
import { supabase } from '@/lib/supabase';

interface EnvironmentalReadings {
  temperature: number;
  humidity: number;
  co2: number | null;
  nh3: number | null;
  iluminacion: number | null;
}

const EnvironmentalFactors = () => {
  const [readings, setReadings] = useState<EnvironmentalReadings>({
    temperature: 24,
    humidity: 65,
    co2: null,
    nh3: null,
    iluminacion: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the current active lote
        const lotes = await loteService.getAllLotes();
        const activeLote = lotes.find(lote => lote.estado === 'activo');
        if (activeLote) {
          // Get latest environmental measurement
          const { data: latestMeasurement, error } = await supabase
            .from('medicion_ambiental')
            .select('*')
            .eq('lote_id', activeLote.lote_id)
            .order('fecha_hora', { ascending: false })
            .limit(1)
            .single();

          if (error) {
            console.error('Error fetching environmental data:', error);
            return;
          }

          if (latestMeasurement) {
            setReadings({
              temperature: Number(latestMeasurement.temperatura.toFixed(1)),
              humidity: Number(latestMeasurement.humedad.toFixed(1)),
              co2: latestMeasurement.co2,
              nh3: latestMeasurement.amoniaco,
              iluminacion: latestMeasurement.iluminacion
            });
          }
        }
      } catch (error) {
        console.error('Error fetching environmental data:', error);
      }
    };

    fetchData();

    // Update every minute
    const intervalId = setInterval(fetchData, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Function to get status color based on value ranges
  const getStatusColor = (type: keyof EnvironmentalReadings) => {
    if (readings[type] === null) return 'bg-gray-200';

    switch (type) {
      case 'temperature':
        return readings.temperature >= 22 && readings.temperature <= 26
          ? 'bg-green-500'
          : 'bg-red-500';
      case 'humidity':
        return readings.humidity >= 60 && readings.humidity <= 70
          ? 'bg-green-500'
          : 'bg-red-500';
      case 'co2':
        return readings.co2 && readings.co2 <= 1000
          ? 'bg-green-500'
          : 'bg-red-500';
      case 'nh3':
        return readings.nh3 && readings.nh3 <= 15
          ? 'bg-green-500'
          : 'bg-red-500';
      case 'iluminacion':
        return readings.iluminacion && readings.iluminacion >= 20 && readings.iluminacion <= 30
          ? 'bg-green-500'
          : 'bg-red-500';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Factores Ambientales</CardTitle>
        <CardDescription>Lecturas en tiempo real</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Temperatura</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{readings.temperature}°C</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor('temperature')}`} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Humedad</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{readings.humidity}%</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor('humidity')}`} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">CO₂</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{readings.co2 ? `${readings.co2} ppm` : 'N/A'}</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor('co2')}`} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">NH₃</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{readings.nh3 ? `${readings.nh3} ppm` : 'N/A'}</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor('nh3')}`} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Iluminación</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{readings.iluminacion ? `${readings.iluminacion} lux` : 'N/A'}</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor('iluminacion')}`} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvironmentalFactors;
