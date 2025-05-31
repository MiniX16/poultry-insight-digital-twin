import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ArrowDown } from 'lucide-react';
import { mortalidadService } from '@/lib/services/mortalidadService';
import { loteService } from '@/lib/services/loteService';

interface MortalityData {
  date: string;
  count: number;
  percentage: number;
}

interface ZoneMortality {
  zone: string;
  count: number;
}

interface CauseData {
  name: string;
  value: number;
  color: string;
}

const MortalityPage = () => {
  const [mortalityData, setMortalityData] = useState<MortalityData[]>([]);
  const [zoneData, setZoneData] = useState<ZoneMortality[]>([]);
  const [causeData, setCauseData] = useState<CauseData[]>([]);
  const [currentLote, setCurrentLote] = useState<any>(null);
  const [totalBirds, setTotalBirds] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the current active lote
        const lotes = await loteService.getAllLotes();
        const activeLote = lotes.find(lote => lote.estado === 'activo');
        if (activeLote) {
          setCurrentLote(activeLote);
          setTotalBirds(activeLote.cantidad_inicial);

          // Get mortality data for the last 15 days
          const mortalityRecords = await mortalidadService.getMortalidadesByLote(activeLote.lote_id);
          
          // Process daily mortality data
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
            acc[dateStr].percentage = Number(((acc[dateStr].count / activeLote.cantidad_inicial) * 100).toFixed(2));
            
            return acc;
          }, {});

          setMortalityData(Object.values(dailyData));

          // Process mortality by cause
          const causeBreakdown = mortalityRecords.reduce((acc: any, record: any) => {
            if (!acc[record.causa]) {
              acc[record.causa] = 0;
            }
            acc[record.causa] += record.cantidad;
            return acc;
          }, {});

          const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#10B981', '#6B7280'];
          setCauseData(Object.entries(causeBreakdown).map(([name, value], index) => ({
            name,
            value: value as number,
            color: colors[index % colors.length]
          })));

          // For zone data, we'll need to process based on the observaciones field
          // Assuming observaciones contains zone information
          const zoneBreakdown = mortalityRecords.reduce((acc: any, record: any) => {
            const zone = record.observaciones?.match(/Zona: ([A-C][1-3])/)?.[1] || 'N/A';
            if (!acc[zone]) {
              acc[zone] = 0;
            }
            acc[zone] += record.cantidad;
            return acc;
          }, {});

          setZoneData(Object.entries(zoneBreakdown).map(([zone, count]) => ({
            zone,
            count: count as number
          })));
        }
      } catch (error) {
        console.error('Error fetching mortality data:', error);
      }
    };

    fetchData();
  }, []);

  // Calculate totals from real data
  const totalMortality = mortalityData.reduce((sum, day) => sum + day.count, 0);
  const avgDailyMortality = mortalityData.length > 0 ? (totalMortality / mortalityData.length).toFixed(1) : '0';
  const accumulatedPercentage = totalBirds > 0 ? ((totalMortality / totalBirds) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mortandad</h1>
        <div className="flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
          <ArrowDown className="h-5 w-5 text-farm-red mr-2" />
          <span className="font-medium">Lote: {currentLote?.codigo || 'N/A'}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mortandad Total</CardTitle>
            <CardDescription>Acumulado del lote</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-farm-red">{totalMortality} aves</span>
              <span className="text-sm text-muted-foreground mt-1">{accumulatedPercentage}% del lote</span>
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
              <span className="text-3xl font-bold text-farm-orange">{avgDailyMortality}</span>
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
              <span className="text-3xl font-bold text-farm-blue">87 aves</span>
              <span className="text-sm text-muted-foreground mt-1">0.58% del lote</span>
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
              <span className="text-3xl font-bold text-farm-green">97.1%</span>
              <span className="text-sm text-muted-foreground mt-1">proyección al día 42</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Distribución por Zonas</CardTitle>
            <CardDescription>Mapa de calor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zone" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Mortandad" fill="#EF4444" />
                </BarChart>
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
