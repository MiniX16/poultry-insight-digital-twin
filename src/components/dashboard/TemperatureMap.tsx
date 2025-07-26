import React, { useEffect, useState } from 'react';
import { useLote } from '@/context/LoteContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mapaTermicoService } from '@/lib/services/mapaTermicoService';

interface TemperatureData {
  rows: (number | null)[][];
}

const TemperatureMap = () => {
  const [temperatureData, setTemperatureData] = useState<TemperatureData>({
    rows: Array(10).fill(Array(15).fill(null)),
  });
  const { currentLote } = useLote();

  useEffect(() => {
    if (!currentLote) return; 
    const fetchData = async () => {
      try {
        const data = await mapaTermicoService.getUltimoMapaPorLote(currentLote.lote_id);
        const { temperaturas } = data;

        setTemperatureData({
          rows: temperaturas,
        });
      } catch (error) {
        console.error("Error loading temperature map:", error);
      }
    };

    fetchData();
  }, [currentLote]);

  const flatten = (rows: (number | null)[][] | undefined) =>
    rows?.flat()?.filter((val): val is number => val !== null) ?? [];

  const values = flatten(temperatureData.rows);
  const minTemp = values.length ? Math.min(...values) : 0;
  const maxTemp = values.length ? Math.max(...values) : 0;

  const getColor = (temp: number | null) => {
    if (temp === null) return 'hsl(0, 0%, 90%)';
    if (minTemp === maxTemp) return 'hsl(0, 0%, 90%)';

    const normalized = (temp - minTemp) / (maxTemp - minTemp);
    const hue = (1 - normalized) * 240;
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
                  title={temp?.toFixed(1) ?? 'N/A'}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>{minTemp.toFixed(1)} °C</span>
          <span>{maxTemp.toFixed(1)} °C</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemperatureMap;
