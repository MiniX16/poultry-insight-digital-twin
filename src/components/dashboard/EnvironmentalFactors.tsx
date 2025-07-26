import React, { useEffect, useState } from 'react';
import { useLote } from '@/context/LoteContext';
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

  useEffect(() => {
    const fetchData = async () => {
      if (!currentLote) return;
      try {
        const data = await medicionAmbientalService.getUltimaMedicionByLote(currentLote.lote_id);
        setReadings({
          temperature: data.temperatura,
          humidity: data.humedad,
          co2: data.co2,
          nh3: data.amoniaco,
          iluminacion: data.iluminacion
        });
      } catch (error) {
        console.error('Error fetching environmental data:', error);
      }
    };

    fetchData();
  }, [currentLote]);

  // Define rangos ideales para colorear
  const getStatusColor = (type: keyof EnvironmentalReadings) => {
    const value = readings[type];
    if (value === null) return 'bg-gray-200';

    const ranges = {
      temperature: { min: 20, max: 26 },
      humidity: { min: 50, max: 70 },
      co2: { max: 3000 },
      nh3: { max: 25 },
      iluminacion: { min: 20, max: 50 }
    };

    const r = ranges[type];
    if (!r) return 'bg-gray-200';

    if ('min' in r && 'max' in r && (value < r.min || value > r.max)) return 'bg-red-400';
    if ('max' in r && value > r.max) return 'bg-red-400';
    return 'bg-green-400';
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
