import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Layers3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { loteService } from '@/lib/services/loteService';
import { consumoService } from '@/lib/services/consumoService';
import { alimentacionService } from '@/lib/services/alimentacionService';
import { crecimientoService } from '@/lib/services/crecimientoService';

interface FeedingData {
  date: string;
  consumption: number;
  water: number;
  ratio: number;
}

interface HourlyData {
  hour: string;
  consumption: number;
}

// Feed composition data
const feedComposition = [
  { ingredient: 'Maíz', percentage: 60, color: '#F9CB40' },
  { ingredient: 'Harina de soja', percentage: 25, color: '#8FBC8F' },
  { ingredient: 'Aceite vegetal', percentage: 5, color: '#FFD700' },
  { ingredient: 'Carbonato de calcio', percentage: 4, color: '#D3D3D3' },
  { ingredient: 'Fosfato dicálcico', percentage: 3, color: '#C0C0C0' },
  { ingredient: 'Sal', percentage: 1, color: '#FFFFFF' },
  { ingredient: 'Aditivos', percentage: 2, color: '#ADD8E6' },
];

const FeedingPage = () => {
  const [feedingData, setFeedingData] = useState<FeedingData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [currentLote, setCurrentLote] = useState<any>(null);
  const [stats, setStats] = useState({
    dailyAvg: { consumption: 0, perBird: 0 },
    conversionRate: 0,
    inventory: { amount: 0, daysLeft: 0 },
    waterRatio: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get todos los lotes
        const lotes = await loteService.getAllLotes();
        if (lotes.length === 0) return;
        setCurrentLote(lotes[0]);
      } catch (error) {
        console.error('Error fetching feeding data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchFeedingData = async () => {
      if (!currentLote) return;
      try {
        // Get dates for the last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        // Get feeding and consumption data
        const { registros: alimentacionData } = await alimentacionService.getResumenAlimentacion(
          currentLote.lote_id,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        const { registros: consumoData } = await consumoService.getResumenConsumo(
          currentLote.lote_id,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        // Process daily data
        const dailyData: FeedingData[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayConsumos = consumoData.filter(c => {
            const consumoDate = new Date(c.fecha_hora);
            return consumoDate.toISOString().split('T')[0] === dateStr;
          });
          const dayTotals = dayConsumos.reduce((acc, curr) => ({
            cantidad_alimento: acc.cantidad_alimento + curr.cantidad_alimento,
            cantidad_agua: acc.cantidad_agua + curr.cantidad_agua
          }), { cantidad_alimento: 0, cantidad_agua: 0 });
          dailyData.unshift({
            date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
            consumption: dayTotals.cantidad_alimento,
            water: dayTotals.cantidad_agua,
            ratio: dayTotals.cantidad_alimento > 0 
              ? Number((dayTotals.cantidad_agua / dayTotals.cantidad_alimento).toFixed(2)) 
              : 0
          });
        }
        setFeedingData(dailyData);
        // Calculate daily averages
        const totalConsumption = dailyData.reduce((sum, day) => sum + day.consumption, 0);
        const avgConsumption = totalConsumption / dailyData.length;
        const perBirdConsumption = avgConsumption / currentLote.cantidad_inicial * 1000; // en gramos
        const perBirdConsumptionKg = perBirdConsumption / 1000; // convertir a kg
        // Get yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        // Get yesterday's growth data
        const yesterdayGrowth = await crecimientoService.getCrecimientosByLote(currentLote.lote_id);
        const yesterdayData = yesterdayGrowth.find(g => g.fecha === yesterdayStr);
        // Calculate feed conversion rate using average consumption per bird
        const feedConversionRate = yesterdayData
          ? perBirdConsumptionKg / yesterdayData.ganancia_diaria
          : 0;
        // Get today's feeding pattern
        const todayFeedings = alimentacionData.filter(
          a => a.fecha === new Date().toISOString().split('T')[0]
        );
        // Process hourly data
        const hourlyConsumption: HourlyData[] = Array.from({ length: 24 }, (_, hour) => {
          const hourStr = `${hour.toString().padStart(2, '0')}:00`;
          const hourFeedings = todayFeedings.filter(f => {
            const feedingHour = new Date(f.hora_suministro).getHours();
            return feedingHour === hour;
          });
          return {
            hour: hourStr,
            consumption: hourFeedings.reduce((sum, f) => sum + f.cantidad_suministrada, 0)
          };
        });
        setHourlyData(hourlyConsumption);
        // Calculate water ratio
        const avgWater = dailyData.reduce((sum, day) => sum + day.water, 0) / dailyData.length;
        const waterRatio = avgConsumption > 0 ? Number((avgWater / avgConsumption).toFixed(2)) : 0;
        // Set stats
        setStats({
          dailyAvg: {
            consumption: Math.round(avgConsumption),
            perBird: Math.round(perBirdConsumption)
          },
          conversionRate: Number(feedConversionRate.toFixed(2)),
          inventory: {
            amount: 6.4, // This should come from inventory table
            daysLeft: 7.8 // This should be calculated based on consumption rate
          },
          waterRatio
        });
      } catch (error) {
        console.error('Error fetching feeding data:', error);
      }
    };
    fetchFeedingData();
  }, [currentLote]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Alimentación</h1>
        <div className="flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
          <Layers3 className="h-5 w-5 text-farm-teal mr-2" />
          <span className="font-medium">Lote: {currentLote?.codigo || 'N/A'}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Consumo Diario</CardTitle>
            <CardDescription>Promedio última semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-teal">{stats.dailyAvg.consumption} kg</span>
              <span className="text-sm text-muted-foreground mt-1">{stats.dailyAvg.perBird} g/ave</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Conversion Alimenticia</CardTitle>
            <CardDescription>Acumulada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-blue">{stats.conversionRate.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground mt-1">kg alimento / kg ganancia</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inventario Actual</CardTitle>
            <CardDescription>Silos disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-orange">{stats.inventory.amount.toFixed(1)} ton</span>
              <span className="text-sm text-muted-foreground mt-1">{stats.inventory.daysLeft.toFixed(1)} días restantes</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Consumo de Agua</CardTitle>
            <CardDescription>Ratio agua/alimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-green">{stats.waterRatio.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground mt-1">litros/kg alimento</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Consumo Semanal</CardTitle>
            <CardDescription>Alimento y agua últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feedingData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#14B8A6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="consumption" 
                    name="Alimento (kg)" 
                    stroke="#14B8A6" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="water" 
                    name="Agua (L)" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Patrón de Consumo</CardTitle>
            <CardDescription>Consumo por hora (kg)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="consumption" name="Consumo (kg)" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Registro de Alimentación</CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Consumo (kg)</TableHead>
                  <TableHead>Agua (L)</TableHead>
                  <TableHead>Ratio Agua/Alimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedingData.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">{day.date}</TableCell>
                    <TableCell>{day.consumption}</TableCell>
                    <TableCell>{day.water}</TableCell>
                    <TableCell>{day.ratio}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Composición del Alimento</CardTitle>
            <CardDescription>Formula actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedComposition.map((item) => (
                <div key={item.ingredient} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.ingredient}</span>
                    <span className="font-medium">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full" 
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeedingPage;
