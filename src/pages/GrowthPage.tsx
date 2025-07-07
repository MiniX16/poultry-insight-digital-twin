import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Timer } from 'lucide-react';
import { crecimientoService } from '@/lib/services/crecimientoService';
import { loteService } from '@/lib/services/loteService';
import { polloService } from '@/lib/services/polloService';

interface GrowthData {
  day: number;
  ideal: number;
  actual: number;
  gain: number;
  date: string;
}

interface WeightDistribution {
  weight: number;
  frequency: number;
}

const GrowthPage = () => {
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [weightDistribution, setWeightDistribution] = useState<WeightDistribution[]>([]);
  const [currentLote, setCurrentLote] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get todos los lotes
        const lotes = await loteService.getAllLotes();
        if (lotes.length > 0) {
          setCurrentLote(lotes[0]);

          // Get growth records for el primer lote
          const growthRecords = await crecimientoService.getCrecimientosByLote(lotes[0].lote_id);
          
          // Process growth data
          const processedGrowthData = growthRecords.map((record: any) => {
            const recordDate = new Date(record.fecha);
            const startDate = new Date(lotes[0].fecha_ingreso);
            const dayDiff = Math.floor((recordDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
            // Calculate ideal weight based on standard growth curve
            // This is a simplified sigmoid function for ideal chicken growth
  const maxWeight = 2800; // max weight in grams
  const growthRate = 0.15;
  const midpoint = 20; // day of fastest growth
            const idealWeight = maxWeight / (1 + Math.exp(-growthRate * (dayDiff - midpoint)));
    
    // Calculate daily gain
            const prevRecord = growthRecords.find((r: any) => {
              const rDate = new Date(r.fecha);
              const rDayDiff = Math.floor((rDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              return rDayDiff === dayDiff - 1;
            });

            const dailyGain = prevRecord 
              ? record.peso_promedio - prevRecord.peso_promedio
              : record.peso_promedio; // For first day, gain equals weight

            return {
              day: dayDiff,
              date: recordDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }),
              ideal: Math.round(idealWeight),
              actual: Math.round(record.peso_promedio),
              gain: Math.round(dailyGain),
            };
          });

          setGrowthData(processedGrowthData.sort((a, b) => a.day - b.day));

          // Obtener los pesos reales de los pollos del lote
          const pollos = await polloService.getPollosByLote(lotes[0].lote_id);
          const pesos = pollos.map((p: any) => p.peso);

          // Si hay datos de pesos, genera la curva suavizada (KDE)
          if (pesos.length > 0) {
            // KDE simple con ventana gaussiana
            const minPeso = Math.min(...pesos);
            const maxPeso = Math.max(...pesos);
            const steps = 30;
            const bandwidth = (maxPeso - minPeso) / 15 || 1; // Ajusta la suavidad
            const kernel = (x: number) => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
            const kde = (x: number) =>
              pesos.reduce((sum, v) => sum + kernel((x - v) / bandwidth), 0) / (pesos.length * bandwidth);
            const distribution = Array.from({ length: steps }, (_, i) => {
              const weight = minPeso + ((maxPeso - minPeso) * i) / (steps - 1);
              return {
                weight,
                frequency: kde(weight) * pesos.length // Escala para que sea comparable
              };
            });
            setWeightDistribution(distribution);
          } else {
            setWeightDistribution([]);
          }
        }
      } catch (error) {
        console.error('Error fetching growth data:', error);
      }
    };

    fetchData();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Crecimiento</h1>
        <div className="flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
          <Timer className="h-5 w-5 text-farm-teal mr-2" />
          <span className="font-medium">Lote: {currentLote?.codigo || 'N/A'}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Peso Actual</CardTitle>
            <CardDescription>Promedio del lote</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-green">{growthData[growthData.length - 1]?.actual} g</span>
              <span className="text-sm text-muted-foreground mt-1">
                {growthData[growthData.length - 1]?.actual > growthData[growthData.length - 1]?.ideal ? '+' : ''}
                {growthData[growthData.length - 1]?.actual - growthData[growthData.length - 1]?.ideal} g vs estándar
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ganancia Diaria</CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-blue">78.6 g</span>
              <span className="text-sm text-muted-foreground mt-1">+3.2% vs estándar</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Uniformidad</CardTitle>
            <CardDescription>Coeficiente de variación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-purple">{weightDistribution[Math.floor(weightDistribution.length / 2)]?.frequency.toFixed(2)}%</span>
              <span className="text-sm text-muted-foreground mt-1">CV: {weightDistribution[Math.floor(weightDistribution.length / 2)]?.frequency.toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Crecimiento Semanal</CardTitle>
            <CardDescription>Tasa de crecimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-orange">{growthData[growthData.length - 1]?.gain > 0 ? '+' : ''}{growthData[growthData.length - 1]?.gain.toFixed(1)}% vs estándar</span>
              <span className="text-sm text-muted-foreground mt-1">últimos 7 días</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Curva de Crecimiento</CardTitle>
            <CardDescription>Peso real vs ideal (g)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
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
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ganancia Diaria de Peso</CardTitle>
            <CardDescription>Gramos por día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData.slice(-7)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" label={{ value: 'Fecha', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="gain" name="Ganancia (g)" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Distribución de Pesos</CardTitle>
            <CardDescription>Día {growthData[growthData.length - 1]?.day}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="weight" 
                    type="number"
                    domain={['dataMin', 'dataMax']} 
                    tickFormatter={(tick) => `${tick}g`}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} aves`, 'Cantidad']} labelFormatter={(label) => `${label}g`} />
                  <Area type="monotone" dataKey="frequency" name="Cantidad" fill="#6366F1" stroke="#4F46E5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Registro de Pesos</CardTitle>
            <CardDescription>Últimos 14 días</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Peso Real (g)</TableHead>
                  <TableHead>Peso Estándar (g)</TableHead>
                  <TableHead>Diferencia (%)</TableHead>
                  <TableHead>Ganancia Diaria (g)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {growthData.slice(growthData.length - 14, growthData.length).map((day) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (growthData.length - day.day));
                  const diffPercent = ((day.actual - day.ideal) / day.ideal * 100).toFixed(1);
                  // Convert diffPercent string to number for comparison
                  const diffPercentNum = parseFloat(diffPercent);
                  
                  return (
                    <TableRow key={day.day}>
                      <TableCell className="font-medium">{day.day}</TableCell>
                      <TableCell>
                        {date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                      </TableCell>
                      <TableCell>{day.actual}</TableCell>
                      <TableCell>{day.ideal}</TableCell>
                      <TableCell className={
                        diffPercentNum > 0 ? 'text-green-600' : diffPercentNum < 0 ? 'text-red-600' : ''
                      }>
                        {diffPercentNum > 0 ? '+' : ''}{diffPercent}%
                      </TableCell>
                      <TableCell>{day.gain}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GrowthPage;

