import React, { useEffect, useState } from 'react';
import { useLote } from '@/context/LoteContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ArrowDown } from 'lucide-react';
import LoteSelector from '@/components/LoteSelector';
import { mortalidadService } from '@/lib/services/mortalidadService';

interface MortalityData {
  date: string;
  count: number;
  percentage: number;
}


interface CauseData {
  name: string;
  value: number;
  color: string;
}

const MortalityPage = () => {
  // State
  const [mortalityData, setMortalityData] = useState<MortalityData[]>([]);
  const [causeData, setCauseData] = useState<CauseData[]>([]);
  const [stats, setStats] = useState({
    total: { count: 0, percentage: 0 },
    avgDaily: 0,
    weekly: { count: 0, percentage: 0 },
    viability: 0
  });
  const { currentLote } = useLote();

  // Fetch mortality data

  useEffect(() => {
    const fetchMortalityData = async () => {
      if (!currentLote) return;
      
      try {
        // --- DATE RANGES ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Date strings for API calls
        const pad = n => n.toString().padStart(2, '0');
        const getLocalDateString = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const todayStr = getLocalDateString(today);
        const fifteenDaysAgoStr = getLocalDateString(fifteenDaysAgo);
        const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);
        
        // --- FETCH ALL MORTALITY DATA ---
        const mortalityRecords = await mortalidadService.getMortalidadesByLote(currentLote.lote_id);
        
        // --- GET SUMMARY DATA ---
        const resumen = await mortalidadService.getResumenMortalidad(
          currentLote.lote_id,
          fifteenDaysAgoStr,
          todayStr
        );
        
        // --- GET WEEKLY DATA ---
        const weeklyResumen = await mortalidadService.getResumenMortalidad(
          currentLote.lote_id,
          sevenDaysAgoStr,
          todayStr
        );
        // --- PROCESS DAILY DATA ---
        const dailyData = mortalityRecords.reduce((acc: any, record: any) => {
          const date = new Date(record.fecha);
          const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          if (!acc[dateStr]) {
            acc[dateStr] = {
              date: dateStr,
              count: 0,
              percentage: 0
            };
          }
          acc[dateStr].count += record.cantidad;
          acc[dateStr].percentage = Number(((acc[dateStr].count / currentLote.cantidad_inicial) * 100).toFixed(2));
          return acc;
        }, {});
        
        // --- SET MORTALITY DATA ---
        setMortalityData(Object.values(dailyData));
        // --- PROCESS MORTALITY BY CAUSE ---
        const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#10B981', '#6B7280'];
        setCauseData(Object.entries(resumen.porCausa).map(([name, value], index) => ({
          name,
          value: value as number,
          color: colors[index % colors.length]
        })));
        
        // --- CALCULATE VIABILITY RATE ---
        const totalMortality = resumen.totalMortalidad;
        const remainingBirds = currentLote.cantidad_inicial - totalMortality;
        const currentViability = (remainingBirds / currentLote.cantidad_inicial) * 100;
        
        // --- SET STATS ---
        setStats({
          total: {
            count: resumen.totalMortalidad,
            percentage: resumen.porcentajeMortalidad
          },
          avgDaily: resumen.promedioMortalidadDiario,
          weekly: {
            count: weeklyResumen.totalMortalidad,
            percentage: weeklyResumen.porcentajeMortalidad
          },
          viability: currentViability
        });
      } catch (error) {
        console.error('Error fetching mortality data:', error);
      }
    };
    
    fetchMortalityData();
    const intervalId = setInterval(fetchMortalityData, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [currentLote]);
  
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mortandad</h1>
        <LoteSelector />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mortandad Total</CardTitle>
            <CardDescription>Acumulado del lote</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-red">{stats.total.count} aves</span>
              <span className="text-sm text-muted-foreground mt-1">{stats.total.percentage.toFixed(2)}% del lote</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Promedio Diario</CardTitle>
            <CardDescription>Últimos 15 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-orange">{stats.avgDaily.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground mt-1">aves por día</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mortandad Semanal</CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-blue">{stats.weekly.count} aves</span>
              <span className="text-sm text-muted-foreground mt-1">{stats.weekly.percentage.toFixed(2)}% del lote</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tasa de Viabilidad</CardTitle>
            <CardDescription>Estimación final</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-green">{stats.viability.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground mt-1">viabilidad actual</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Evolución de Mortandad Diaria</CardTitle>
            <CardDescription>Últimos 15 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mortalityData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#EF4444" />
                  <YAxis yAxisId="right" orientation="right" stroke="#8B5CF6" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    name="Aves"
                    fill="#EF4444"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="percentage" 
                    name="Porcentaje (%)" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Registro Detallado</CardTitle>
            <CardDescription>Mortandad diaria</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Mortandad</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead>Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mortalityData.slice(0, 10).map((day, index) => {
                  const accumulated = mortalityData
                    .slice(0, index + 1)
                    .reduce((sum, d) => sum + d.count, 0);
                    
                  return (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell>{day.count} aves</TableCell>
                      <TableCell>{day.percentage}%</TableCell>
                      <TableCell>{accumulated} aves</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Causas de Mortandad</CardTitle>
            <CardDescription>Distribución por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={causeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {causeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <ul className="space-y-2">
                {causeData.map((cause) => (
                  <li key={cause.name} className="flex items-center">
                    <span 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: cause.color }}
                    ></span>
                    <span>{cause.name}: {cause.value} aves</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MortalityPage;
