import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface EnvironmentalReadings {
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  nh3: number | null;
  iluminacion: number | null;
}

const EnvironmentalFactors = () => {
  const readings: EnvironmentalReadings = {
    temperature: null,
    humidity: null,
    co2: null,
    nh3: null,
    iluminacion: null
  };

  // Function to get status color based on value ranges
  const getStatusColor = (type: keyof EnvironmentalReadings) => {
    return 'bg-gray-200';
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
              <span className="text-2xl font-bold">N/A</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor('temperature')}`} />
            </div>
          </div>
        
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Humedad</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">N/A</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor('humidity')}`} />
            </div>
          </div>
        
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">CO₂</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">N/A</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor('co2')}`} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">NH₃</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">N/A</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor('nh3')}`} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Iluminación</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">N/A</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor('iluminacion')}`} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvironmentalFactors;
