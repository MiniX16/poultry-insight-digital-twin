import React, { useEffect, useState } from 'react';
import { useLote } from '@/context/LoteContext';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mapaTermicoService } from '@/lib/services/mapaTermicoService';

interface TemperatureData {
  rows: (number | null)[][];
  originalRows?: number;
  originalCols?: number;
}

const TemperatureMap = () => {
  const [temperatureData, setTemperatureData] = useState<TemperatureData>({
    rows: Array(10).fill(null).map(() => Array(15).fill(null)),
  });
  const { currentLote } = useLote();
  const { settings } = useSettings();

  // Matrix adaptation algorithm: converts any NxM matrix to 10x15 using block mapping
  const adaptMatrix = (originalMatrix: (number | null)[][]): (number | null)[][] => {
    if (!originalMatrix || originalMatrix.length === 0) {
      return Array(10).fill(null).map(() => Array(15).fill(null));
    }

    const originalRows = originalMatrix.length;
    const originalCols = originalMatrix[0]?.length || 0;
    
    if (originalRows === 0 || originalCols === 0) {
      return Array(10).fill(null).map(() => Array(15).fill(null));
    }

    const targetRows = 10;
    const targetCols = 15;
    const adaptedMatrix: (number | null)[][] = [];

    // Block mapping: each target cell maps directly to one source cell
    for (let targetRow = 0; targetRow < targetRows; targetRow++) {
      const row: (number | null)[] = [];
      
      for (let targetCol = 0; targetCol < targetCols; targetCol++) {
        // Calculate which source cell this target cell belongs to
        // This creates clear blocks where each source cell covers a rectangular area
        const sourceRow = Math.floor((targetRow * originalRows) / targetRows);
        const sourceCol = Math.floor((targetCol * originalCols) / targetCols);
        
        // Ensure we don't go out of bounds
        const clampedSourceRow = Math.min(sourceRow, originalRows - 1);
        const clampedSourceCol = Math.min(sourceCol, originalCols - 1);
        
        // Get the value from the source matrix
        const value = originalMatrix[clampedSourceRow]?.[clampedSourceCol] ?? null;
        
        row.push(value);
      }
      
      adaptedMatrix.push(row);
    }

    return adaptedMatrix;
  };

  useEffect(() => {
    if (!currentLote) return; 
    const fetchData = async () => {
      try {
        const data = await mapaTermicoService.getUltimoMapaPorLote(currentLote.lote_id);
        const { temperaturas } = data;

        // Adapt the matrix to 10x15 regardless of original size
        const adaptedMatrix = adaptMatrix(temperaturas);

        setTemperatureData({
          rows: adaptedMatrix,
          originalRows: temperaturas?.length || 0,
          originalCols: temperaturas?.[0]?.length || 0,
        });
      } catch (error) {
        console.error("Error loading temperature map:", error);
        // Set default empty matrix on error
        setTemperatureData({
          rows: Array(10).fill(null).map(() => Array(15).fill(null)),
        });
      }
    };

    fetchData();
  }, [currentLote]);

  const getColor = (temp: number | null) => {
    if (temp === null || temp === undefined || isNaN(temp)) {
      return 'hsl(0, 0%, 90%)'; // Gray for null/invalid values
    }

    const { minTemp, maxTemp } = settings.thermalMapRange;
    
    if (minTemp === maxTemp) {
      return 'hsl(0, 0%, 90%)'; // Gray if range is invalid
    }

    // Clamp temperature to range and normalize
    const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temp));
    const normalized = (clampedTemp - minTemp) / (maxTemp - minTemp);
    
    // Blue (240°) for cold, Red (0°) for hot
    const hue = (1 - normalized) * 240;
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa Térmico</CardTitle>
        <CardDescription>
          Distribución actual de temperatura
          {temperatureData.originalRows && temperatureData.originalCols && 
            ` (${temperatureData.originalRows}×${temperatureData.originalCols} → 10×15)`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="grid gap-1 w-full max-w-md mx-auto"
          style={{
            gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(10, minmax(0, 1fr))',
            aspectRatio: '15/10'
          }}
        >
          {temperatureData.rows.map((row, i) => 
            row.map((temp, j) => (
              <div
                key={`${i}-${j}`}
                className="rounded-sm border border-background/10"
                style={{
                  backgroundColor: getColor(temp),
                  minHeight: '12px',
                  minWidth: '12px',
                }}
                title={temp !== null && !isNaN(temp) ? `${temp.toFixed(1)}°C` : 'N/A'}
              />
            ))
          )}
        </div>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span className="flex items-center">
            <div className="w-3 h-3 rounded-sm mr-1" style={{backgroundColor: `hsl(240, 70%, 50%)`}}></div>
            {settings.thermalMapRange.minTemp}°C
          </span>
          <span className="flex items-center">
            {settings.thermalMapRange.maxTemp}°C
            <div className="w-3 h-3 rounded-sm ml-1" style={{backgroundColor: `hsl(0, 70%, 50%)`}}></div>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemperatureMap;
