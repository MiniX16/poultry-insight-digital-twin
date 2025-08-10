import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TemperatureMap from '@/components/dashboard/TemperatureMap';
import EnvironmentalFactors from '@/components/dashboard/EnvironmentalFactors';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';
import { useLote } from '@/context/LoteContext';
import LoteSelector from '@/components/LoteSelector';

interface EnvironmentalData {
  time: string;
  value: number;
}

const EnvironmentalPage = () => {
  const [temperatureData, setTemperatureData] = useState<EnvironmentalData[]>([]);
  const [humidityData, setHumidityData] = useState<EnvironmentalData[]>([]);
  const [co2Data, setCo2Data] = useState<EnvironmentalData[]>([]);
  const [nh3Data, setNh3Data] = useState<EnvironmentalData[]>([]);
  const { currentLote } = useLote();

  useEffect(() => {
    const fetchEnvData = async () => {
      if (!currentLote) return;
      try {
        // Base dates - following Dashboard pattern
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Date strings for API calls
        const pad = n => n.toString().padStart(2, '0');
        const getLocalDateString = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const todayStr = getLocalDateString(today);
        const tomorrowStr = getLocalDateString(tomorrow);
        
        const measurements = await medicionAmbientalService.getMedicionesByLoteAndRango(
          currentLote.lote_id,
          todayStr + 'T00:00:00',
          tomorrowStr + 'T00:00:00'
        );
        
        // Process the data for each environmental factor
        const processedData = measurements.reduce((acc: any, record: any) => {
          const time = new Date(record.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          if (!acc.temperature) acc.temperature = [];
          if (!acc.humidity) acc.humidity = [];
          if (!acc.co2) acc.co2 = [];
          if (!acc.nh3) acc.nh3 = [];
          acc.temperature.push({
            time,
            value: Number(record.temperatura.toFixed(1))
          });
          acc.humidity.push({
            time,
            value: Number(record.humedad.toFixed(1))
          });
          if (record.co2) {
            acc.co2.push({
              time,
              value: Math.round(record.co2)
            });
          }
          if (record.amoniaco) {
            acc.nh3.push({
              time,
              value: Math.round(record.amoniaco)
            });
          }
          return acc;
        }, {});
        
        setTemperatureData(processedData.temperature || []);
        setHumidityData(processedData.humidity || []);
        setCo2Data(processedData.co2 || []);
        setNh3Data(processedData.nh3 || []);
      } catch (error) {
        console.error('Error fetching environmental data:', error);
      }
    };
    
    fetchEnvData();
    const intervalId = setInterval(fetchEnvData, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [currentLote]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ambiente</h1>
        <LoteSelector />
      </div>
      
      <Tabs defaultValue="temperature" className="space-y-4">
        <TabsList>
          <TabsTrigger value="temperature">Temperatura</TabsTrigger>
          <TabsTrigger value="humidity">Humedad</TabsTrigger>
          <TabsTrigger value="co2">CO₂</TabsTrigger>
          <TabsTrigger value="nh3">NH₃</TabsTrigger>
        </TabsList>

        <TabsContent value="temperature">
      <Card>
        <CardHeader>
              <CardTitle>Historial de Temperatura</CardTitle>
              <CardDescription>Últimas 24 horas</CardDescription>
        </CardHeader>
        <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={temperatureData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Temperatura (°C)" stroke="#ef4444" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
            </TabsContent>
            
        <TabsContent value="humidity">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Humedad</CardTitle>
              <CardDescription>Últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={humidityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Humedad (%)" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
            </TabsContent>
            
        <TabsContent value="co2">
          <Card>
            <CardHeader>
              <CardTitle>Niveles de CO₂</CardTitle>
              <CardDescription>Últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={co2Data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 'auto']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="CO₂ (ppm)" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
            </TabsContent>
            
        <TabsContent value="nh3">
          <Card>
            <CardHeader>
              <CardTitle>Niveles de NH₃</CardTitle>
              <CardDescription>Últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={nh3Data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 'auto']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="NH₃ (ppm)" stroke="#8b5cf6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
            </TabsContent>
          </Tabs>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <TemperatureMap />
        <EnvironmentalFactors />
      </div>
    </div>
  );
};

export default EnvironmentalPage;
