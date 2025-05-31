import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mortalidadService } from '@/lib/services/mortalidadService';
import { loteService } from '@/lib/services/loteService';

interface ZoneMortality {
  zone: string;
  count: number;
}

const MortalityChart = () => {
  const [data, setData] = useState<ZoneMortality[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the current active lote
        const lotes = await loteService.getAllLotes();
        const activeLote = lotes.find(lote => lote.estado === 'activo');
        if (!activeLote) return;

        // Get mortality data for the last 24 hours
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const mortalityRecords = await mortalidadService.getMortalidadesByLote(activeLote.lote_id);

        // Process mortality by zone
        const zoneData = mortalityRecords.reduce((acc: { [key: string]: number }, record) => {
          const recordDate = new Date(record.fecha);
          if (recordDate >= yesterday && recordDate <= now) {
            // Extract zone from observaciones field (assuming format "Zona: XX")
            const zone = record.observaciones?.match(/Zona: ([A-C][1-3])/)?.[1] || 'N/A';
            acc[zone] = (acc[zone] || 0) + record.cantidad;
          }
          return acc;
        }, {});

        // Convert to array format
        const formattedData = Object.entries(zoneData).map(([zone, count]) => ({
          zone,
          count
        }));

        // Sort by zone
        formattedData.sort((a, b) => a.zone.localeCompare(b.zone));

        setData(formattedData);
      } catch (error) {
        console.error('Error fetching mortality data:', error);
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
        <CardTitle className="text-lg">Mortandad por Zona</CardTitle>
        <CardDescription>Últimas 24 horas</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zone" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Aves" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MortalityChart;
