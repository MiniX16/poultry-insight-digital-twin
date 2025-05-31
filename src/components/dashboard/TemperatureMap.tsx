import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';
import { loteService } from '@/lib/services/loteService';
import { supabase } from '@/lib/supabase';

interface TemperatureData {
  rows: number[][];
  minTemp: number;
  maxTemp: number;
}

const TemperatureMap = () => {
  const [temperatureData, setTemperatureData] = useState<TemperatureData>({
    rows: Array(10).fill(Array(15).fill(24)),
    minTemp: 24,
    maxTemp: 24
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
            console.error('Error fetching temperature data:', error);
            return;
          }

          if (latestMeasurement) {
            // Use the latest measurement to create a temperature distribution
            const baseTemp = latestMeasurement.temperatura;
            
            // Create a temperature distribution based on the latest reading
            const rows = 10;
            const cols = 15;
            const data: number[][] = [];
            
            for (let i = 0; i < rows; i++) {
              const row: number[] = [];
              for (let j = 0; j < cols; j++) {
                // Create a natural temperature gradient
                // Center point has the base temperature
                const centerX = cols / 2;
                const centerY = rows / 2;
                const distance = Math.sqrt(Math.pow(i - centerY, 2) + Math.pow(j - centerX, 2));
                const maxDistance = Math.sqrt(Math.pow(rows, 2) + Math.pow(cols, 2)) / 2;
                
                // Temperature varies more at the edges
                const variation = (distance / maxDistance) * 2;
                const temp = baseTemp + (Math.random() * variation - variation / 2);
                
                row.push(Number(temp.toFixed(1)));
              }
              data.push(row);
            }

            // Calculate min and max temperatures
            const allTemps = data.flat();
            const minTemp = Math.min(...allTemps);
            const maxTemp = Math.max(...allTemps);

            setTemperatureData({
              rows: data,
              minTemp,
              maxTemp
            });
          }
        }
      } catch (error) {
        console.error('Error fetching temperature data:', error);
      }
    };

    fetchData();

    // Update every minute
    const intervalId = setInterval(fetchData, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Function to get color based on temperature
  const getColor = (temp: number) => {
    const { minTemp, maxTemp } = temperatureData;
    const normalizedTemp = (temp - minTemp) / (maxTemp - minTemp);
    
    // Color gradient from blue (cold) to red (hot)
    const hue = (1 - normalizedTemp) * 240; // 240 is blue, 0 is red
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa Térmico</CardTitle>
        <CardDescription>Distribución actual de temperatura</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-15 gap-1">
          {temperatureData.rows.map((row, i) => (
            <React.Fragment key={i}>
              {row.map((temp, j) => (
                <div
                  key={`${i}-${j}`}
                  className="aspect-square rounded-sm"
                  style={{
                    backgroundColor: getColor(temp),
                    gridColumn: j + 1,
                    gridRow: i + 1,
                  }}
                  title={`${temp}°C`}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>{temperatureData.minTemp.toFixed(1)}°C</span>
          <span>{temperatureData.maxTemp.toFixed(1)}°C</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemperatureMap;
