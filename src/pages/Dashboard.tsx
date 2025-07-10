import React, { useEffect, useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import TemperatureMap from '@/components/dashboard/TemperatureMap';
import ConsumptionChart from '@/components/dashboard/ConsumptionChart';
import MortalityChart from '@/components/dashboard/MortalityChart';
import GrowthChart from '@/components/dashboard/GrowthChart';
import EnvironmentalFactors from '@/components/dashboard/EnvironmentalFactors';
import { ThermometerSun, Droplets, ArrowDown, Timer, PowerIcon, Gauge } from 'lucide-react';
import LoteSelector from '@/components/LoteSelector';
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';
import { consumoService } from '@/lib/services/consumoService';
import { mortalidadService } from '@/lib/services/mortalidadService';
import { crecimientoService } from '@/lib/services/crecimientoService';
import { loteService } from '@/lib/services/loteService';
import { supabase } from '@/lib/supabase';

const Dashboard = () => {
  const [stats, setStats] = useState({
    temperature: { value: '0.0', trend: 0 },
    water: { value: '0', trend: 0 },
    mortality: { value: '0', trend: 0 },
    weight: { value: '0.00', trend: 0 },
    power: { value: '0', trend: 0 },
    efficiency: { value: '0.0', trend: 0 }
  });
  const [currentLote, setCurrentLote] = useState<any>(null);

  // El estado y la lógica de lotes ahora están en LoteSelector

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentLote) return;
      try {
        // Get today's start and end dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all measurements for today
        const { data: todayMeasurements, error: envError } = await supabase
          .from('medicion_ambiental')
          .select('temperatura, fecha_hora')
          .eq('lote_id', currentLote.lote_id)
          .gte('fecha_hora', today.toISOString())
          .lt('fecha_hora', tomorrow.toISOString())
          .order('fecha_hora', { ascending: false });

        if (envError) {
          console.error('Error fetching environmental data:', envError);
          return;
        }

        // Calculate average temperature for today
        const temperatures = todayMeasurements?.map(m => m.temperatura) || [];
        const avgTemp = temperatures.length > 0
          ? temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length
          : 0;

        // Get yesterday's measurements for trend calculation
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const { data: yesterdayMeasurements } = await supabase
          .from('medicion_ambiental')
          .select('temperatura, fecha_hora')
          .eq('lote_id', currentLote.lote_id)
          .gte('fecha_hora', yesterday.toISOString())
          .lt('fecha_hora', today.toISOString())
          .order('fecha_hora', { ascending: false });

        // Calculate yesterday's average temperature
        const yesterdayTemps = yesterdayMeasurements?.map(m => m.temperatura) || [];
        const yesterdayAvg = yesterdayTemps.length > 0
          ? yesterdayTemps.reduce((sum, temp) => sum + temp, 0) / yesterdayTemps.length
          : avgTemp;

        // Calculate temperature trend
        const tempTrend = yesterdayAvg !== 0
          ? Number(((avgTemp - yesterdayAvg) / yesterdayAvg * 100).toFixed(2))
          : 0;

        // Get today's consumption data
        const todayDate = today.toISOString().split('T')[0];
        const yesterdayDate = yesterday.toISOString().split('T')[0];

        // Get today's consumption data
        const { data: todayConsumptions, error: todayError } = await supabase
          .from('consumo')
          .select('cantidad_agua, kwh, fecha_hora')
          .eq('lote_id', currentLote.lote_id)
          .gte('fecha_hora', today.toISOString())
          .lt('fecha_hora', tomorrow.toISOString());

        if (todayError) {
          console.error('Error fetching today consumption:', todayError);
        }

        // Get yesterday's consumption data
        const { data: yesterdayConsumptions, error: yesterdayError } = await supabase
          .from('consumo')
          .select('cantidad_agua, kwh, fecha_hora')
          .eq('lote_id', currentLote.lote_id)
          .gte('fecha_hora', yesterday.toISOString())
          .lt('fecha_hora', today.toISOString());

        if (yesterdayError) {
          console.error('Error fetching yesterday consumption:', yesterdayError);
        }

        // Calculate today's averages
        const todayWater = todayConsumptions && todayConsumptions.length > 0
          ? todayConsumptions.reduce((sum, record) => sum + record.cantidad_agua, 0) / todayConsumptions.length
          : 0;
        const todayPower = todayConsumptions && todayConsumptions.length > 0
          ? todayConsumptions.reduce((sum, record) => sum + record.kwh, 0) / todayConsumptions.length
          : 0;

        // Calculate yesterday's averages
        const yesterdayWater = yesterdayConsumptions && yesterdayConsumptions.length > 0
          ? yesterdayConsumptions.reduce((sum, record) => sum + record.cantidad_agua, 0) / yesterdayConsumptions.length
          : todayWater;
        const yesterdayPower = yesterdayConsumptions && yesterdayConsumptions.length > 0
          ? yesterdayConsumptions.reduce((sum, record) => sum + record.kwh, 0) / yesterdayConsumptions.length
          : todayPower;

        // Calculate water consumption trend
        const waterTrend = yesterdayWater !== 0
          ? Number(((todayWater - yesterdayWater) / yesterdayWater * 100).toFixed(2))
          : 0;

        // Calculate power consumption trend (negative because lower consumption is better)
        const powerTrend = yesterdayPower !== 0
          ? -Number(((todayPower - yesterdayPower) / yesterdayPower * 100).toFixed(2))
          : 0;

        // Get today's weight data
        const { data: todayWeight, error: weightError } = await supabase
          .from('crecimiento')
          .select('peso_promedio, fecha')
          .eq('lote_id', currentLote.lote_id)
          .order('fecha', { ascending: false })
          .limit(1)
          .single();

        if (weightError) {
          console.error('Error fetching today weight:', weightError);
        }

        // Get previous weight data
        const { data: yesterdayWeight, error: yesterdayWeightError } = await supabase
          .from('crecimiento')
          .select('peso_promedio, fecha')
          .eq('lote_id', currentLote.lote_id)
          .lt('fecha', todayWeight?.fecha || todayDate)
          .order('fecha', { ascending: false })
          .limit(1)
          .single();

        if (yesterdayWeightError) {
          console.error('Error fetching previous weight:', yesterdayWeightError);
        }

        // Get weight values
        const latestWeight = todayWeight?.peso_promedio ?? 0;
        const prevWeight = yesterdayWeight?.peso_promedio ?? latestWeight;

        // Calculate weight trend
        const weightTrend = prevWeight !== 0
          ? Number(((latestWeight - prevWeight) / prevWeight * 100).toFixed(2))
          : 0;

        // Get mortality data
        const mortalityData = await mortalidadService.getMortalidadesByLote(currentLote.lote_id);

        // Get growth data
        const growthData = await crecimientoService.getCrecimientosByLote(currentLote.lote_id);

        // Process mortality data
        const todayMortality = mortalityData.reduce((sum, record) => {
          const recordDate = new Date(record.fecha);
          if (recordDate.toDateString() === today.toDateString()) {
            return sum + record.cantidad;
          }
          return sum;
        }, 0);
        const yesterdayMortality = mortalityData.reduce((sum, record) => {
          const recordDate = new Date(record.fecha);
          if (recordDate.toDateString() === yesterday.toDateString()) {
            return sum + record.cantidad;
          }
          return sum;
        }, 0);
        const mortalityTrend = yesterdayMortality ? ((todayMortality - yesterdayMortality) / yesterdayMortality) * 100 : 0;

        // Process growth data
        const growthRate = 0.15;
        const dayDiff = Math.floor((today.getTime() - new Date(currentLote.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const maxWeight = 2800; // max weight in grams
        const midpoint = 20; // day of fastest growth
        const idealWeight = maxWeight / (1 + Math.exp(-growthRate * (dayDiff - midpoint)));
        
        const weightEfficiency = (latestWeight / idealWeight) * 100;
        const survivalRate = ((currentLote.cantidad_inicial - todayMortality) / currentLote.cantidad_inicial) * 100;
        const efficiency = (survivalRate * weightEfficiency) / 100;
        const prevEfficiency = 98; // You might want to store historical efficiency data
        const efficiencyTrend = ((efficiency - prevEfficiency) / prevEfficiency) * 100;

        setStats({
          temperature: { 
            value: avgTemp.toFixed(1), 
            trend: tempTrend 
          },
          water: { 
            value: Math.round(todayWater).toString(), 
            trend: waterTrend 
          },
          mortality: { 
            value: todayMortality.toString(), 
            trend: -mortalityTrend // Negative because lower mortality is better
          },
          weight: { 
            value: latestWeight.toFixed(2), // Ya está en kg, no necesitamos dividir por 1000
            trend: weightTrend 
          },
          power: { 
            value: Math.round(todayPower).toString(), 
            trend: -powerTrend // Now the trend is already negative when consumption increases
          },
          efficiency: { 
            value: efficiency.toFixed(1), 
            trend: efficiencyTrend 
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchStats();
    // Update every minute
    const intervalId = setInterval(fetchStats, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [currentLote]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Panel de Control</h1>
        <LoteSelector currentLote={currentLote} setCurrentLote={setCurrentLote} />
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Temperatura Promedio" 
          value={`${stats.temperature.value} °C`}
          icon={<ThermometerSun className="h-5 w-5" />} 
          trend={{ value: stats.temperature.trend, isPositive: stats.temperature.trend >= 0 }}
          color="text-farm-blue"
        />
        
        <StatCard 
          title="Consumo de Agua" 
          value={`${stats.water.value} L`}
          icon={<Droplets className="h-5 w-5" />} 
          trend={{ value: stats.water.trend, isPositive: stats.water.trend >= 0 }}
          color="text-farm-teal"
        />
        
        <StatCard 
          title="Mortandad Diaria" 
          value={`${stats.mortality.value} aves`}
          icon={<ArrowDown className="h-5 w-5" />} 
          trend={{ value: stats.mortality.trend, isPositive: stats.mortality.trend >= 0 }}
          color="text-farm-red"
        />
        
        <StatCard 
          title="Peso Promedio" 
          value={`${stats.weight.value} g`}
          icon={<Timer className="h-5 w-5" />} 
          trend={{ value: stats.weight.trend, isPositive: stats.weight.trend >= 0 }}
          color="text-farm-green"
        />
        
        <StatCard 
          title="Consumo Eléctrico" 
          value={`${stats.power.value} kWh`}
          icon={<PowerIcon className="h-5 w-5" />} 
          trend={{ value: stats.power.trend, isPositive: stats.power.trend >= 0 }}
          color="text-farm-purple"
        />
        
        <StatCard 
          title="Eficiencia Productiva" 
          value={`${stats.efficiency.value}%`}
          icon={<Gauge className="h-5 w-5" />} 
          trend={{ value: stats.efficiency.trend, isPositive: stats.efficiency.trend >= 0 }}
          color="text-farm-orange"
        />
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Temperature Map */}
        <div className="lg:col-span-4">
          <TemperatureMap />
        </div>
        
        {/* Environmental Factors */}
        <div className="lg:col-span-4">
          <EnvironmentalFactors />
        </div>
        
        {/* Mortality Chart */}
        <div className="lg:col-span-4">
          <MortalityChart />
        </div>
        
        {/* Growth Chart */}
        <div className="lg:col-span-6">
          <GrowthChart />
        </div>
        
        {/* Consumption Chart */}
        <div className="lg:col-span-6">
          <ConsumptionChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
