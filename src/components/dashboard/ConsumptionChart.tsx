import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { consumoService } from '@/lib/services/consumoService';
import { useLote } from '@/context/LoteContext';

interface ConsumptionData {
  label: string;
  power: number | null;
  water: number | null;
  tooltipLabel?: string;
}

const ConsumptionChart = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [data, setData] = useState<ConsumptionData[]>([]);
  const { currentLote } = useLote();

  // Helper function to create hourly data for 24h view
  const createHourlyData = (records: any[]): ConsumptionData[] => {
    const hourlyData: ConsumptionData[] = Array.from({ length: 24 }, (_, i) => ({
      label: `${i.toString().padStart(2, '0')}:00`,
      tooltipLabel: `${i.toString().padStart(2, '0')}:00`,
      power: null,
      water: null
    }));

    // Collect all values for each hour
    const hourlyValues: Record<number, { power: number[], water: number[] }> = {};

    records.forEach(record => {
      const date = new Date(record.fecha_hora);
      const hour = date.getHours();
      
      if (!hourlyValues[hour]) {
        hourlyValues[hour] = { power: [], water: [] };
      }
      
      if (record.kwh !== null) hourlyValues[hour].power.push(record.kwh);
      if (record.cantidad_agua !== null) hourlyValues[hour].water.push(record.cantidad_agua);
    });

    // Calculate averages for each hour
    Object.entries(hourlyValues).forEach(([hour, values]) => {
      const hourIndex = parseInt(hour);
      if (hourlyData[hourIndex]) {
        hourlyData[hourIndex].power = values.power.length > 0 
          ? values.power.reduce((a, b) => a + b, 0) / values.power.length 
          : null;
        hourlyData[hourIndex].water = values.water.length > 0 
          ? values.water.reduce((a, b) => a + b, 0) / values.water.length 
          : null;
      }
    });

    return hourlyData;
  };

  // Helper function to create daily data for 7d and 30d views
  const createDailyData = (records: any[]): ConsumptionData[] => {
    const dailyData: Record<string, { power: number[], water: number[] }> = {};

    records.forEach(record => {
      const date = new Date(record.fecha_hora);
      const key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!dailyData[key]) {
        dailyData[key] = { power: [], water: [] };
      }
      if (record.kwh !== null) dailyData[key].power.push(record.kwh);
      if (record.cantidad_agua !== null) dailyData[key].water.push(record.cantidad_agua);
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([key, values]) => {
        const fecha = new Date(key);
        return {
          label: fecha.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' }),
          tooltipLabel: fecha.toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          }),
          power: values.power.length > 0 ? values.power.reduce((a, b) => a + b, 0) / values.power.length : null,
          water: values.water.length > 0 ? values.water.reduce((a, b) => a + b, 0) / values.water.length : null
        };
      })
      .filter(item => item.power !== null || item.water !== null);
  };

  // Helper function to get records based on time range
  const getRecordsForTimeRange = (allRecords: any[], timeRange: string): any[] => {
    switch (timeRange) {
      case '24h':
        return allRecords.slice(0, 24);
      case '7d':
        return allRecords.slice(0, 7 * 24);
      case '30d':
        return allRecords.slice(0, 30 * 24);
      default:
        return allRecords.slice(0, 24);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentLote) {
        console.log("No currentLote available");
        return;
      }
      
      try {
        const allRecords = await consumoService.getConsumosByLote(currentLote.lote_id);
        const records = getRecordsForTimeRange(allRecords, timeRange);
        
        let chartData: ConsumptionData[];
        
        if (timeRange === '24h') {
          chartData = createHourlyData(records);
        } else {
          chartData = createDailyData(records);
        }
        
        setData(chartData);
      } catch (error) {
        console.error("Error fetching consumption data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange, currentLote]);

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
              <XAxis dataKey="label" />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#10B981"
                tickFormatter={(v) => v?.toFixed(2) ?? 'N/A'}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#0EA5E9"
                tickFormatter={(v) => v?.toFixed(2) ?? 'N/A'}
              />
              <Tooltip
                formatter={(value: any) => value !== null ? Number(value).toFixed(2) : 'N/A'}
                labelFormatter={(label, payload) =>
                  payload.length > 0 && payload[0].payload.tooltipLabel
                    ? payload[0].payload.tooltipLabel
                    : label
                }
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="power"
                name="Energía (kW)"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="water"
                name="Agua (L)"
                stroke="#0EA5E9"
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
