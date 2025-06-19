import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TemperatureData {
  rows: number[][];
  minTemp: number;
  maxTemp: number;
}

const TemperatureMap = () => {
  // Create a static placeholder grid
  const rows = 10;
  const cols = 15;
  const placeholderGrid = Array(rows).fill(Array(cols).fill(null));

  const temperatureData: TemperatureData = {
    rows: placeholderGrid,
    minTemp: 0,
    maxTemp: 0
  };

  // Mantener esta función para cuando haya datos reales
  const getColor = (temp: number | null) => {
    if (temp === null) return 'hsl(0, 0%, 90%)'; // Light gray for no data

    const { minTemp, maxTemp } = temperatureData;
    // Si no hay rango de temperaturas, devolver gris
    if (minTemp === maxTemp) return 'hsl(0, 0%, 90%)';
    
    const normalizedTemp = (temp - minTemp) / (maxTemp - minTemp);
    // Color gradient from blue (cold) to red (hot)
    const hue = (1 - normalizedTemp) * 240; // 240 is blue, 0 is red
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Esta función será útil para crear la distribución de temperatura cuando haya datos
  const createTemperatureDistribution = (baseTemp: number, rows: number, cols: number) => {
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
  return data;
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
                  title="N/A"
                  />
                ))}
            </React.Fragment>
            ))}
        </div>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>N/A</span>
          <span>N/A</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemperatureMap;
