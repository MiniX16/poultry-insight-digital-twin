import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { consumoService } from '@/lib/services/consumoService';
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';
import { loteService } from '@/lib/services/loteService';

interface ConsumptionData {
  hour: string;
  power: number;
  water: number;
  feed: number;
}

const ConsumptionChart = () => {
  const [timeRange, setTimeRange] = React.useState('24h');
  const [data, setData] = useState<ConsumptionData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the current active lote
        const lotes = await loteService.getAllLotes();
        const activeLote = lotes.find(lote => lote.estado === 'activo');
        if (!activeLote) return;

        // Calculate time range based on selection
        const now = new Date();
        let startDate = new Date();
        switch (timeRange) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }

        // Get consumption and environmental data
        const consumptionData = await consumoService.getConsumosByLote(activeLote.lote_id);
        const envMeasurements = await medicionAmbientalService.getMedicionesByLoteAndRango(
          activeLote.lote_id,
          startDate.toISOString(),
          now.toISOString()
        );

        // Process data by hour
        const hourlyData: { [key: string]: ConsumptionData } = {};

        // Process water consumption
        consumptionData.forEach(record => {
          const date = new Date(record.fecha);
          if (date >= startDate && date <= now) {
            const hour = date.getHours().toString().padStart(2, '0') + ':00';
            if (!hourlyData[hour]) {
              hourlyData[hour] = {
                hour,
                power: 0,
                water: 0,
                feed: 0
              };
            }
            hourlyData[hour].water += record.cantidad_agua;
          }
        });

        // Process power consumption from environmental data
        envMeasurements.forEach(record => {
          const date = new Date(record.fecha_hora);
          const hour = date.getHours().toString().padStart(2, '0') + ':00';
          if (!hourlyData[hour]) {
            hourlyData[hour] = {
              hour,
              power: 0,
              water: 0,
              feed: 0
            };
          }
          // Simplified power calculation based on temperature
          hourlyData[hour].power += record.temperatura * 0.5;
        });

        // Sort data by hour
        const sortedData = Object.values(hourlyData).sort((a, b) => {
          const hourA = parseInt(a.hour.split(':')[0]);
          const hourB = parseInt(b.hour.split(':')[0]);
          return hourA - hourB;
        });

        setData(sortedData);
      } catch (error) {
        console.error('Error fetching consumption data:', error);
      }
    };

    fetchData();
    // Update every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [timeRange]);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Consumos</CardTitle>
            <CardDescription>Energía y agua</CardDescription>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="power" stroke="#0EA5E9" name="Energía (kW)" />
              <Line type="monotone" dataKey="water" stroke="#10B981" name="Agua (L)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsumptionChart;
