import React, { useEffect, useState } from 'react';
import { useLote } from '@/context/LoteContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Layers3 } from 'lucide-react';
import LoteSelector from '@/components/LoteSelector';
import PageLoader from '@/components/ui/page-loader';
import { useSettings } from '@/context/SettingsContext';
import { consumoService } from '@/lib/services/consumoService';
import { alimentacionService } from '@/lib/services/alimentacionService';
import { crecimientoService } from '@/lib/services/crecimientoService';
import { mortalidadService } from '@/lib/services/mortalidadService';

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
  // State
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [feedingData, setFeedingData] = useState<FeedingData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [stats, setStats] = useState({
    dailyAvg: { consumption: 0, perBird: 0 },
    conversionRate: 0,
    waterRatio: 0
  });
  const { currentLote } = useLote();
  const { settings } = useSettings();

  // Fetch feeding data

  useEffect(() => {
    const fetchFeedingData = async () => {
      if (!currentLote) {
        setIsInitialLoading(false);
        return;
      }
      
      // Only show loading screen on initial load when there's no data
      if (!hasData) {
        setIsInitialLoading(true);
      }
      
      try {
        // --- DATE RANGES ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Date strings for API calls
        const pad = n => n.toString().padStart(2, '0');
        const getLocalDateString = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const todayStr = getLocalDateString(today);
        const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);
        // --- FETCH DATA ---
        const loteStartDate = currentLote.fecha_ingreso; // Start from lote beginning for conversion calculation
        
        // Get feeding data for last 7 days (for display) and cumulative (for conversion)
        const { registros: alimentacionData } = await alimentacionService.getResumenAlimentacion(
          currentLote.lote_id,
          sevenDaysAgoStr,
          todayStr
        );
        const { registros: alimentacionCumulative } = await alimentacionService.getResumenAlimentacion(
          currentLote.lote_id,
          loteStartDate,
          todayStr
        );
        const { registros: consumoData } = await consumoService.getResumenConsumo(
          currentLote.lote_id,
          sevenDaysAgoStr,
          todayStr
        );
        // --- PROCESS DAILY DATA ---
        const dailyData: FeedingData[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = getLocalDateString(date);
          // --- DAILY CONSUMPTION CALCULATION ---
          const dayConsumos = consumoData.filter(c => {
            // Extract date part only to avoid timezone issues
            const consumoDateStr = c.fecha_hora.split('T')[0];
            return consumoDateStr === dateStr;
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
        
        // --- SET FEEDING DATA ---
        setFeedingData(dailyData);
        
        // --- CALCULATE STATS ---
        const totalConsumption = dailyData.reduce((sum, day) => sum + day.consumption, 0);
        const avgConsumption = totalConsumption / dailyData.length;
        const perBirdConsumption = avgConsumption / currentLote.cantidad_inicial * 1000; // en gramos
        const perBirdConsumptionKg = perBirdConsumption / 1000; // convertir a kg
        
        // --- FEED CONVERSION CALCULATION ---
        // Get mortality data to calculate living birds
        const mortalityData = await mortalidadService.getResumenMortalidad(
          currentLote.lote_id,
          loteStartDate,
          todayStr
        );
        const livingBirds = mortalityData.cantidadRestante;
        
        // Get growth data for weight calculation
        const allGrowthData = await crecimientoService.getCrecimientosByLote(currentLote.lote_id);
        console.log('All growth data:', allGrowthData);
        console.log('Living birds:', livingBirds, 'Initial:', currentLote.cantidad_inicial);
        
        // Calculate total cumulative feed consumption
        const totalCumulativeFeed = alimentacionCumulative.reduce((sum, record) => sum + record.cantidad_suministrada, 0);
        console.log('Total cumulative feed:', totalCumulativeFeed);
        
        let feedConversionRate = 0;
        if (allGrowthData.length >= 2 && livingBirds > 0) {
          // Use first and last growth measurements for total weight gain
          const firstWeight = allGrowthData[0].peso_promedio / 1000; // Convert to kg
          const lastWeight = allGrowthData[allGrowthData.length - 1].peso_promedio / 1000; // Convert to kg
          
          // Calculate total weight gained per bird
          const weightGainPerBird = lastWeight - firstWeight;
          
          console.log('Feed conversion calculation:', { 
            firstWeight, 
            lastWeight, 
            weightGainPerBird,
            totalCumulativeFeed,
            livingBirds,
            initialBirds: currentLote.cantidad_inicial
          });
          
          if (weightGainPerBird > 0) {
            // Feed Conversion Rate = Total Feed Consumed / (Current Living Birds × Weight Gain per Bird)
            // We use current living birds because that's the weight we can actually measure
            const totalWeightGained = livingBirds * weightGainPerBird;
            feedConversionRate = totalCumulativeFeed / totalWeightGained;
          }
        }
        
        console.log('Feed conversion rate:', feedConversionRate);
        
        // --- HOURLY FEEDING PATTERN ---
        // First try today, if no data, use the most recent day with data
        let feedingsForHourly = alimentacionData.filter(a => a.fecha.startsWith(todayStr));
        if (feedingsForHourly.length === 0 && alimentacionData.length > 0) {
          // Get the most recent date with feeding data
          const mostRecentDate = alimentacionData.reduce((latest, current) => 
            current.fecha > latest ? current.fecha : latest, alimentacionData[0].fecha);
          const mostRecentDateStr = mostRecentDate.split('T')[0];
          feedingsForHourly = alimentacionData.filter(a => a.fecha.startsWith(mostRecentDateStr));
        }
        console.log('Feedings for hourly chart:', feedingsForHourly);
        
        // --- PROCESS HOURLY DATA ---
        const hourlyConsumption: HourlyData[] = Array.from({ length: 24 }, (_, hour) => {
          const hourStr = `${hour.toString().padStart(2, '0')}:00`;
          const hourFeedings = feedingsForHourly.filter(f => {
            // Extract hour from the fecha timestamp
            const feedingHour = new Date(f.fecha).getHours();
            return feedingHour === hour;
          });
          const consumption = hourFeedings.reduce((sum, f) => sum + f.cantidad_suministrada, 0);
          return {
            hour: hourStr,
            consumption: consumption
          };
        });
        
        console.log('Processed hourly consumption:', hourlyConsumption);
        
        // --- SET HOURLY DATA ---
        setHourlyData(hourlyConsumption);
        
        // --- CALCULATE WATER RATIO ---
        const avgWater = dailyData.reduce((sum, day) => sum + day.water, 0) / dailyData.length;
        const waterRatio = avgConsumption > 0 ? Number((avgWater / avgConsumption).toFixed(2)) : 0;
        // --- SET STATS ---
        setStats({
          dailyAvg: {
            consumption: Math.round(avgConsumption),
            perBird: Math.round(perBirdConsumption)
          },
          conversionRate: Number(feedConversionRate.toFixed(2)),
          waterRatio
        });
        
        // Mark that we have data now
        setHasData(true);
      } catch (error) {
        console.error('Error fetching feeding data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    fetchFeedingData();
    const intervalId = setInterval(fetchFeedingData, settings.refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [currentLote, settings.refreshInterval]);

  return (
    <>
      {isInitialLoading && <PageLoader message="Cargando datos de alimentación..." />}
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Alimentación</h1>
        <LoteSelector />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
    </>
  );
};

export default FeedingPage;
