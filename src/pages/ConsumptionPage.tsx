import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { PowerIcon, Droplets } from 'lucide-react';
import { consumoService } from '@/lib/services/consumoService';
import { loteService } from '@/lib/services/loteService';
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';
import LoteSelector from '@/components/LoteSelector';

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
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dailyData, setDailyData] = useState<ConsumptionData[]>([]);
  const [electricBreakdown, setElectricBreakdown] = useState<ConsumptionBreakdown[]>([]);
  const [currentLote, setCurrentLote] = useState<any>(null);
  const [birdCount, setBirdCount] = useState<number>(0);

  // El estado y la lógica de lotes ahora están en LoteSelector

  useEffect(() => {
    const fetchConsumptionData = async () => {
      if (!currentLote) return;
      try {
        // Get consumption data for el lote seleccionado
        const consumptionRecords = await consumoService.getConsumosByLote(currentLote.lote_id);
        // Process daily consumption data
        const dailyConsumption = consumptionRecords.reduce((acc: any, record: any) => {
          const date = new Date(record.fecha_hora);
          const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
          const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          const dateKey = `${dayName} ${formattedDate}`;
          if (!acc[dateKey]) {
            acc[dateKey] = {
              date: dateKey,
              electricity: 0,
              water: record.cantidad_agua
            };
          }
          acc[dateKey].water += record.cantidad_agua;
          return acc;
        }, {});
        setDailyData(Object.values(dailyConsumption));
        // Get environmental measurements for temperature data
        const today = new Date();
        const measurements = await medicionAmbientalService.getMedicionesByLoteAndRango(
          currentLote.lote_id,
          new Date(today.setHours(0, 0, 0, 0)).toISOString(),
          new Date(today.setHours(23, 59, 59, 999)).toISOString()
        );
        // Process hourly data
        const hourlyMeasurements = measurements.reduce((acc: any, record: any) => {
          const hour = new Date(record.fecha_hora).getHours();
          const hourKey = `${hour}:00`;
          if (!acc[hourKey]) {
            acc[hourKey] = {
              hour: hourKey,
              usage: 0,
              temperature: record.temperatura
            };
          }
          acc[hourKey].usage = Math.round(record.temperatura * 0.5);
          return acc;
        }, {});
        setHourlyData(Object.values(hourlyMeasurements));
        setElectricBreakdown([
          { name: 'Ventilación', value: 42, color: '#3B82F6' },
          { name: 'Iluminación', value: 18, color: '#F59E0B' },
          { name: 'Alimentación', value: 23, color: '#10B981' },
          { name: 'Refrigeración', value: 12, color: '#8B5CF6' },
          { name: 'Otros', value: 5, color: '#6B7280' },
        ]);
      } catch (error) {
        console.error('Error fetching consumption data:', error);
      }
    };
    fetchConsumptionData();
  }, [currentLote]);
  
  // Calculate today's and average values
  const todayData = dailyData[dailyData.length - 1] || { electricity: 0, water: 0 };
  const todayElectricity = todayData.electricity;
  const todayWater = todayData.water;
  
  const avgElectricity = Math.round(
    dailyData.reduce((sum, day) => sum + day.electricity, 0) / (dailyData.length || 1)
  );
  
  const avgWater = Math.round(
    dailyData.reduce((sum, day) => sum + day.water, 0) / (dailyData.length || 1)
  );
  
  // Calculate per-bird metrics
  const electricityPerBird = birdCount ? ((todayElectricity / birdCount) * 1000).toFixed(1) : '0'; // Wh per bird
  const waterPerBird = birdCount ? (todayWater / birdCount).toFixed(2) : '0';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Consumos</h1>
        <LoteSelector currentLote={currentLote} setCurrentLote={setCurrentLote} />
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
                  <span className="text-3xl font-bold text-farm-purple">{todayElectricity} kWh</span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {todayElectricity > avgElectricity ? '+' : ''}
                    {todayElectricity - avgElectricity} kWh vs promedio
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
                  <span className="text-3xl font-bold text-farm-blue">{avgElectricity} kWh</span>
                  <span className="text-sm text-muted-foreground mt-1">14.6 kWh/h promedio</span>
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
                  <span className="text-3xl font-bold text-farm-teal">{electricityPerBird} Wh</span>
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
                  <span className="text-3xl font-bold text-farm-orange">€32.40</span>
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
                  <span className="text-3xl font-bold text-farm-teal">{todayWater} L</span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {todayWater > avgWater ? '+' : ''}
                    {todayWater - avgWater} L vs promedio
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
                  <span className="text-3xl font-bold text-farm-blue">{avgWater} L</span>
                  <span className="text-sm text-muted-foreground mt-1">{(avgWater / 1000).toFixed(2)} m³/día</span>
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
                  <span className="text-3xl font-bold text-farm-green">{waterPerBird} L</span>
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
                  <span className="text-3xl font-bold text-farm-orange">1.92</span>
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
                  <TableCell>{(day.water / birdCount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsumptionPage;
