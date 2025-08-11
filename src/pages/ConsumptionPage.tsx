import React, { useEffect, useState } from 'react';
import { useLote } from '@/context/LoteContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { PowerIcon, Droplets } from 'lucide-react';
import LoteSelector from '@/components/LoteSelector';
import PageLoader from '@/components/ui/page-loader';
import { useSettings } from '@/context/SettingsContext';
import { consumoService } from '@/lib/services/consumoService';
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';
import { alimentacionService } from '@/lib/services/alimentacionService';
import type { Database } from '@/lib/database.types';

type Consumo = Database['public']['Tables']['consumo']['Row'];
type Alimentacion = Database['public']['Tables']['alimentacion']['Row'];

interface ConsumptionData {
  date: string;
  electricity: number;
  water: number;
}

interface HourlyData {
  hour: string;
  usage: number;
  temperature: number;
}

interface ConsumptionBreakdown {
  name: string;
  value: number;
  color: string;
}

const ConsumptionPage = () => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dailyData, setDailyData] = useState<ConsumptionData[]>([]);
  const [electricBreakdown, setElectricBreakdown] = useState<ConsumptionBreakdown[]>([]);
  const [stats, setStats] = useState({
    todayElectricity: 0,
    todayWater: 0,
    avgElectricity: 0,
    avgWater: 0,
    electricityPerBird: 0,
    waterPerBird: 0,
    waterFoodRatio: 0,
    totalCost: 0,
    hourlyRate: 0
  });
  const { currentLote } = useLote();
  const { settings } = useSettings();

  // Fetch consumption data

  useEffect(() => {
    const fetchConsumptionData = async () => {
      if (!currentLote) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // --- DATE RANGES ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        // Date strings for API calls
        const pad = n => n.toString().padStart(2, '0');
        const getLocalDateString = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const todayStr = getLocalDateString(today);
        const tomorrowStr = getLocalDateString(tomorrow);
        const fourteenDaysAgoStr = getLocalDateString(fourteenDaysAgo);
        
        // --- FETCH CONSUMPTION DATA ---
        const consumptionRecords = await consumoService.getConsumosByLote(currentLote.lote_id);
        // --- PROCESS DAILY CONSUMPTION DATA ---
        const dailyConsumption = consumptionRecords.reduce((acc: Record<string, ConsumptionData>, record: Consumo) => {
          const date = new Date(record.fecha_hora);
          const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
          const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          const dateKey = `${dayName} ${formattedDate}`;
          if (!acc[dateKey]) {
            acc[dateKey] = {
              date: dateKey,
              electricity: 0,
              water: 0
            };
          }
          acc[dateKey].electricity += record.kwh || 0;
          acc[dateKey].water += record.cantidad_agua || 0;
          return acc;
        }, {});
        
        const processedDailyData = Object.values(dailyConsumption);
        
        // --- SET DAILY DATA ---
        setDailyData(processedDailyData);
        // --- FETCH TODAY'S HOURLY DATA ---
        const todayConsumption = consumptionRecords.filter(record => {
          const recordDate = new Date(record.fecha_hora);
          return getLocalDateString(recordDate) === todayStr;
        });
        
        const measurements = await medicionAmbientalService.getMedicionesByLoteAndRango(
          currentLote.lote_id,
          todayStr + 'T00:00:00',
          tomorrowStr + 'T00:00:00'
        );
        // --- PROCESS HOURLY DATA ---
        const hourlyUsage = Array.from({ length: 24 }, (_, hour) => {
          const hourStr = `${hour.toString().padStart(2, '0')}:00`;
          
          // Get consumption for this hour
          const hourConsumption = todayConsumption.filter(record => {
            const recordHour = new Date(record.fecha_hora).getHours();
            return recordHour === hour;
          });
          
          // Get temperature for this hour
          const hourMeasurements = measurements.filter(record => {
            const recordHour = new Date(record.fecha_hora).getHours();
            return recordHour === hour;
          });
          
          const totalUsage = hourConsumption.reduce((sum, record) => sum + (record.kwh || 0), 0);
          const avgTemp = hourMeasurements.length > 0 
            ? hourMeasurements.reduce((sum, record) => sum + record.temperatura, 0) / hourMeasurements.length 
            : 0;
            
          return {
            hour: hourStr,
            usage: totalUsage,
            temperature: avgTemp
          };
        });
        
        // --- SET HOURLY DATA ---
        setHourlyData(hourlyUsage);
        // --- CALCULATE ELECTRICITY BREAKDOWN ---
        // This could be based on equipment data, for now use reasonable estimates
        const totalElectricity = processedDailyData.reduce((sum: number, day: ConsumptionData) => sum + day.electricity, 0);
        if (totalElectricity > 0) {
          setElectricBreakdown([
            { name: 'Ventilación', value: 42, color: '#3B82F6' },
            { name: 'Iluminación', value: 18, color: '#F59E0B' },
            { name: 'Alimentación', value: 23, color: '#10B981' },
            { name: 'Refrigeración', value: 12, color: '#8B5CF6' },
            { name: 'Otros', value: 5, color: '#6B7280' },
          ]);
        }
        
        // --- FETCH FEEDING DATA FOR WATER/FOOD RATIO ---
        const { registros: feedingRecords } = await alimentacionService.getResumenAlimentacion(
          currentLote.lote_id,
          todayStr,
          todayStr
        );
        
        // --- CALCULATE STATS ---
        const todayData = processedDailyData.find((day: ConsumptionData) => day.date.includes(today.getDate().toString().padStart(2, '0'))) || { electricity: 0, water: 0 };
        const avgElectricity = processedDailyData.length > 0 
          ? processedDailyData.reduce((sum: number, day: ConsumptionData) => sum + day.electricity, 0) / processedDailyData.length 
          : 0;
        const avgWater = processedDailyData.length > 0 
          ? processedDailyData.reduce((sum: number, day: ConsumptionData) => sum + day.water, 0) / processedDailyData.length 
          : 0;
        
        const birdCount = currentLote.cantidad_inicial || 1;
        const electricityPerBird = (todayData.electricity / birdCount) * 1000; // Wh per bird
        const waterPerBird = todayData.water / birdCount;
        
        const totalFeedToday = feedingRecords.reduce((sum: number, record: Alimentacion) => sum + (record.cantidad_suministrada || 0), 0);
        const waterFoodRatio = totalFeedToday > 0 ? todayData.water / totalFeedToday : 0;
        
        const electricityRate = 0.15; // €/kWh
        const totalCost = avgElectricity * electricityRate;
        const hourlyRate = avgElectricity / 24;
        
        // --- SET STATS ---
        setStats({
          todayElectricity: Math.round(todayData.electricity),
          todayWater: Math.round(todayData.water),
          avgElectricity: Math.round(avgElectricity),
          avgWater: Math.round(avgWater),
          electricityPerBird: Math.round(electricityPerBird * 10) / 10,
          waterPerBird: Math.round(waterPerBird * 100) / 100,
          waterFoodRatio: Math.round(waterFoodRatio * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          hourlyRate: Math.round(hourlyRate * 100) / 100
        });
      } catch (error) {
        console.error('Error fetching consumption data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConsumptionData();
    const intervalId = setInterval(fetchConsumptionData, settings.refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [currentLote, settings.refreshInterval]);
  
  
  return (
    <>
      {isLoading && <PageLoader message="Cargando datos de consumo..." />}
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Consumos</h1>
        <LoteSelector />
      </div>
      
      <Tabs defaultValue="electricity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="electricity">Electricidad</TabsTrigger>
          <TabsTrigger value="water">Agua</TabsTrigger>
        </TabsList>
        
        <TabsContent value="electricity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Consumo Hoy</CardTitle>
                <CardDescription>Total del día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-farm-purple">{stats.todayElectricity} kWh</span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {stats.todayElectricity > stats.avgElectricity ? '+' : ''}
                    {stats.todayElectricity - stats.avgElectricity} kWh vs promedio
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Promedio Diario</CardTitle>
                <CardDescription>Últimos 14 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-farm-blue">{stats.avgElectricity} kWh</span>
                  <span className="text-sm text-muted-foreground mt-1">{stats.hourlyRate} kWh/h promedio</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Consumo por Ave</CardTitle>
                <CardDescription>Hoy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-farm-teal">{stats.electricityPerBird} Wh</span>
                  <span className="text-sm text-muted-foreground mt-1">por ave</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Costo Estimado</CardTitle>
                <CardDescription>Tarifa promedio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-farm-orange">€{stats.totalCost}</span>
                  <span className="text-sm text-muted-foreground mt-1">€0.15/kWh</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Consumo por Hora</CardTitle>
                <CardDescription>Últimas 24 horas (kWh)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8B5CF6" />
                      <YAxis yAxisId="right" orientation="right" stroke="#EF4444" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="usage" 
                        name="Consumo (kWh)" 
                        stroke="#8B5CF6" 
                        strokeWidth={2} 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="temperature" 
                        name="Temperatura (°C)" 
                        stroke="#EF4444" 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Distribución por Equipo</CardTitle>
                <CardDescription>Porcentaje de consumo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={electricBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {electricBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <ul className="space-y-2">
                    {electricBreakdown.map((item) => (
                      <li key={item.name} className="flex items-center">
                        <span 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        ></span>
                        <span>{item.name}: {item.value}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="water" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Consumo Hoy</CardTitle>
                <CardDescription>Total del día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-farm-teal">{stats.todayWater} L</span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {stats.todayWater > stats.avgWater ? '+' : ''}
                    {stats.todayWater - stats.avgWater} L vs promedio
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Promedio Diario</CardTitle>
                <CardDescription>Últimos 14 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-farm-blue">{stats.avgWater} L</span>
                  <span className="text-sm text-muted-foreground mt-1">{(stats.avgWater / 1000).toFixed(2)} m³/día</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Consumo por Ave</CardTitle>
                <CardDescription>Hoy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-farm-green">{stats.waterPerBird} L</span>
                  <span className="text-sm text-muted-foreground mt-1">por ave</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ratio Agua/Alimento</CardTitle>
                <CardDescription>Hoy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-farm-orange">{stats.waterFoodRatio}</span>
                  <span className="text-sm text-muted-foreground mt-1">litros/kg alimento</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tendencia de Consumo de Agua</CardTitle>
              <CardDescription>Últimos 14 días (L)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="water" name="Consumo de Agua (L)" fill="#0EA5E9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Consumos Diarios</CardTitle>
          <CardDescription>Electricidad y agua por día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" stroke="#8B5CF6" />
                <YAxis yAxisId="right" orientation="right" stroke="#0EA5E9" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="electricity" 
                  name="Electricidad (kWh)" 
                  stroke="#8B5CF6" 
                  strokeWidth={2} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="water" 
                  name="Agua (L)" 
                  stroke="#0EA5E9" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Registro de Consumos</CardTitle>
          <CardDescription>Últimos 14 días</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Electricidad (kWh)</TableHead>
                <TableHead>Agua (L)</TableHead>
                <TableHead>Costo Eléctrico (€)</TableHead>
                <TableHead>L Agua / Ave</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyData.map((day) => (
                <TableRow key={day.date}>
                  <TableCell className="font-medium">{day.date}</TableCell>
                  <TableCell>{day.electricity}</TableCell>
                  <TableCell>{day.water}</TableCell>
                  <TableCell>{(day.electricity * 0.15).toFixed(2)}</TableCell>
                  <TableCell>{(day.water / (currentLote?.cantidad_inicial || 1)).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default ConsumptionPage;
