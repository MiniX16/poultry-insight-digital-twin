import React, { useEffect, useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import TemperatureMap from '@/components/dashboard/TemperatureMap';
import ConsumptionChart from '@/components/dashboard/ConsumptionChart';
import MortalityChart from '@/components/dashboard/MortalityChart';
import GrowthChart from '@/components/dashboard/GrowthChart';
import EnvironmentalFactors from '@/components/dashboard/EnvironmentalFactors';
import { ThermometerSun, Droplets, ArrowDown, Timer, PowerIcon, Gauge } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the current active lote
        const lotes = await loteService.getAllLotes();
        console.log('Todos los lotes:', lotes);
        const activeLote = lotes.find(lote => lote.estado === 'activo');
        console.log('Lote activo:', activeLote);
        if (!activeLote) return;

        // Get latest environmental data
        const { data: latestMeasurement, error: envError } = await supabase
          .from('medicion_ambiental')
          .select('*')
          .eq('lote_id', activeLote.lote_id)
          .order('fecha_hora', { ascending: false })
          .limit(1)
          .single();

        if (envError) {
          console.error('Error fetching environmental data:', envError);
          return;
        }

        if (!latestMeasurement) return;

        // Get today's start
        const today = new Date(latestMeasurement.fecha_hora);
        today.setHours(0, 0, 0, 0);
        
        // Get yesterday's start
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Get environmental measurements for the last 24 hours
        const envMeasurements = await medicionAmbientalService.getMedicionesByLoteAndRango(
          activeLote.lote_id,
          yesterday.toISOString(),
          today.toISOString()
        );

        // Get latest consumption data
        const consumptionData = await consumoService.getConsumosByLote(activeLote.lote_id);
        console.log('Consumption data:', consumptionData);

        // Get mortality data
        const mortalityData = await mortalidadService.getMortalidadesByLote(activeLote.lote_id);
        console.log('Mortality data:', mortalityData);

        // Get growth data
        const growthData = await crecimientoService.getCrecimientosByLote(activeLote.lote_id);
        console.log('Growth data:', growthData);

        // Process environmental data
        const latestTemp = latestMeasurement.temperatura;
        console.log('Latest temperature:', latestTemp);
        const prevTemp = envMeasurements.length > 1 ? envMeasurements[envMeasurements.length - 2]?.temperatura || latestTemp : latestTemp;
        const tempTrend = ((latestTemp - prevTemp) / prevTemp) * 100;

        // Process water consumption
        const todayWater = consumptionData.reduce((sum, record) => {
          const recordDate = new Date(record.fecha);
          if (recordDate.toDateString() === today.toDateString()) {
            return sum + record.cantidad_agua;
          }
          return sum;
        }, 0);
        const yesterdayWater = consumptionData.reduce((sum, record) => {
          const recordDate = new Date(record.fecha);
          if (recordDate.toDateString() === yesterday.toDateString()) {
            return sum + record.cantidad_agua;
          }
          return sum;
        }, 0);
        const waterTrend = yesterdayWater ? ((todayWater - yesterdayWater) / yesterdayWater) * 100 : 0;

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
        const latestWeight = growthData[growthData.length - 1]?.peso_promedio || 0;
        const prevWeight = growthData[growthData.length - 2]?.peso_promedio || latestWeight;
        const weightTrend = ((latestWeight - prevWeight) / prevWeight) * 100;

        // Process power consumption (assuming kWh is calculated from environmental readings)
        const todayPower = envMeasurements.reduce((sum, record) => {
          const recordDate = new Date(record.fecha_hora);
          if (recordDate.toDateString() === today.toDateString()) {
            // Simplified power calculation based on temperature
            return sum + (record.temperatura * 0.5); // Example calculation
          }
          return sum;
        }, 0);
        const yesterdayPower = envMeasurements.reduce((sum, record) => {
          const recordDate = new Date(record.fecha_hora);
          if (recordDate.toDateString() === yesterday.toDateString()) {
            return sum + (record.temperatura * 0.5);
          }
          return sum;
        }, 0);
        const powerTrend = yesterdayPower ? ((todayPower - yesterdayPower) / yesterdayPower) * 100 : 0;

        // Calculate efficiency (example: survival rate * weight gain efficiency)
        const totalMortality = mortalityData.reduce((sum, record) => sum + record.cantidad, 0);
        const survivalRate = ((activeLote.cantidad_inicial - totalMortality) / activeLote.cantidad_inicial) * 100;
        
        // Calculate ideal weight using sigmoid function
        const dayDiff = Math.floor((today.getTime() - new Date(activeLote.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const maxWeight = 2800; // max weight in grams
        const growthRate = 0.15;
        const midpoint = 20; // day of fastest growth
        const idealWeight = maxWeight / (1 + Math.exp(-growthRate * (dayDiff - midpoint)));
        
        const weightEfficiency = (latestWeight / idealWeight) * 100;
        const efficiency = (survivalRate * weightEfficiency) / 100;
        const prevEfficiency = 98; // You might want to store historical efficiency data
        const efficiencyTrend = ((efficiency - prevEfficiency) / prevEfficiency) * 100;

        setStats({
          temperature: { 
            value: latestTemp.toFixed(1), 
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
            value: (latestWeight / 1000).toFixed(2), 
            trend: weightTrend 
          },
          power: { 
            value: Math.round(todayPower).toString(), 
            trend: -powerTrend // Negative because lower power consumption is better
          },
          efficiency: { 
            value: efficiency.toFixed(1), 
            trend: efficiencyTrend 
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    // Update every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Panel de Control</h1>
      
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
          value={`${stats.weight.value} kg`}
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
