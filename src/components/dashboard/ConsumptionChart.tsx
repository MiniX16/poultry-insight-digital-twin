import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { consumoService } from '@/lib/services/consumoService';
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';
import { loteService } from '@/lib/services/loteService';

interface ConsumptionData {
  label: string;
  power: number | null;
  water: number | null;
  feed: number | null;
  tooltipLabel?: string;
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

        // Get consumption data
        const consumptionData = await consumoService.getConsumosByLote(activeLote.lote_id);

        if (timeRange === '24h') {
          // Process hourly data for 24h view
          const hourlyData: { [key: string]: ConsumptionData } = {};
          for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0') + ':00';
            hourlyData[hour] = {
              label: hour,
              power: null,
              water: null,
              feed: null
            };
          }

          consumptionData.forEach(record => {
            const date = new Date(record.fecha_hora);
            if (date >= startDate && date <= now) {
              const hour = date.getHours().toString().padStart(2, '0') + ':00';
              hourlyData[hour] = {
                label: hour,
                power: record.kwh,
                water: record.cantidad_agua,
                feed: record.cantidad_alimento
              };
            }
          });

          // Sort data by hour
          const sortedData = Object.values(hourlyData).sort((a, b) => {
            const hourA = parseInt(a.label.split(':')[0]);
            const hourB = parseInt(b.label.split(':')[0]);
            return hourA - hourB;
          });

          setData(sortedData);
        } else {
          // Process daily data for 7d and 30d views
          const dailyData: { [key: string]: { 
            power: number[],
            water: number[],
            feed: number[],
            date: Date 
          }} = {};

          // Solo procesar los registros que tienen datos
          consumptionData.forEach(record => {
            const date = new Date(record.fecha_hora);
            if (date >= startDate && date <= now) {
              const dayKey = date.toISOString().split('T')[0];
              if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                  power: [],
                  water: [],
                  feed: [],
                  date: new Date(dayKey)
                };
              }
              
              if (record.kwh !== null) dailyData[dayKey].power.push(record.kwh);
              if (record.cantidad_agua !== null) dailyData[dayKey].water.push(record.cantidad_agua);
              if (record.cantidad_alimento !== null) dailyData[dayKey].feed.push(record.cantidad_alimento);
            }
          });

          // Calculate daily averages only for days with data
          const averagedData = Object.entries(dailyData)
            .filter(([_, values]) => values.power.length > 0 || values.water.length > 0 || values.feed.length > 0)
            .map(([dayKey, values]) => {
              const avgPower = values.power.length > 0 
                ? values.power.reduce((a, b) => a + b, 0) / values.power.length 
                : null;
              const avgWater = values.water.length > 0
                ? values.water.reduce((a, b) => a + b, 0) / values.water.length
                : null;
              const avgFeed = values.feed.length > 0
                ? values.feed.reduce((a, b) => a + b, 0) / values.feed.length
                : null;

              return {
                label: values.date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' }),
                tooltipLabel: values.date.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }),
                power: avgPower,
                water: avgWater,
                feed: avgFeed
              };
            });

          // Sort by date
          const sortedData = averagedData.sort((a, b) => {
            const dateA = new Date(Object.keys(dailyData).find(key => 
              dailyData[key].date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' }) === a.label
            ) || '');
            const dateB = new Date(Object.keys(dailyData).find(key => 
              dailyData[key].date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' }) === b.label
            ) || '');
            return dateA.getTime() - dateB.getTime();
          });

          setData(sortedData);
        }
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
            <CardDescription>
              {timeRange === '24h' ? 'Por hora' : 'Promedio diario'} de energía y agua
            </CardDescription>
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
              <XAxis 
                dataKey="label"
                interval="preserveStartEnd"
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#0EA5E9"
                tickFormatter={(value) => value?.toFixed(2) ?? 'N/A'}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#10B981"
                tickFormatter={(value) => value?.toFixed(2) ?? 'N/A'}
              />
              <Tooltip 
                formatter={(value: any) => value !== null ? Number(value).toFixed(2) : 'N/A'}
                labelFormatter={(label: string, payload: any[]) => {
                  if (payload.length > 0 && payload[0].payload.tooltipLabel) {
                    return payload[0].payload.tooltipLabel;
                  }
                  return label;
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="power" 
                name="Energía (kW)" 
                stroke="#0EA5E9" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="water" 
                name="Agua (L)" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsumptionChart;
