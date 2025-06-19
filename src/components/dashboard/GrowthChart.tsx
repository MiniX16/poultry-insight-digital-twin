import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { crecimientoService } from '@/lib/services/crecimientoService';
import { loteService } from '@/lib/services/loteService';

interface GrowthData {
  day: number;
  date: string;
  ideal: number;
  actual: number;
}

const GrowthChart = () => {
  const [data, setData] = useState<GrowthData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the current active lote
        const lotes = await loteService.getAllLotes();
        const activeLote = lotes.find(lote => lote.estado === 'activo');
        if (!activeLote) return;

        // Get growth records for the lote
        const growthRecords = await crecimientoService.getCrecimientosByLote(activeLote.lote_id);

        // Process growth data
        const processedData = growthRecords.map(record => {
          const recordDate = new Date(record.fecha);
          const startDate = new Date(activeLote.fecha_ingreso);
          const dayDiff = Math.floor((recordDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
          // Calculate ideal weight based on standard growth curve
          // This is a simplified sigmoid function for ideal chicken growth
  const maxWeight = 2800; // max weight in grams
  const growthRate = 0.15;
  const midpoint = 20; // day of fastest growth
          const idealWeight = maxWeight / (1 + Math.exp(-growthRate * (dayDiff - midpoint)));

          return {
            day: dayDiff,
            date: recordDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }),
            ideal: Math.round(idealWeight),
            actual: Math.round(record.peso_promedio)
          };
        });

        // Sort by day
        processedData.sort((a, b) => a.day - b.day);

        setData(processedData);
      } catch (error) {
        console.error('Error fetching growth data:', error);
      }
    };

    fetchData();
    // Update every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Curva de Crecimiento</CardTitle>
        <CardDescription>Peso real vs ideal (g)</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" label={{ value: 'Fecha', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Peso (g)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="ideal" 
                name="Peso Ideal" 
                stroke="#8B5CF6" 
                strokeDasharray="5 5" 
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                name="Peso Real" 
                stroke="#14B8A6" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GrowthChart;
