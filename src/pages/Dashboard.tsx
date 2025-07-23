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

// Helpers
const getAvg = (arr, key) => {
  const valid = arr.map(item => item[key]).filter(v => typeof v === 'number' && !isNaN(v));
  if (!valid.length) return 0;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
};

const Dashboard = () => {
  // State
  const [stats, setStats] = useState({
    temperature: { value: '0.0', trend: 0 },
    water: { value: '0', trend: 0 },
    mortality: { value: '0', trend: 0 },
    weight: { value: '0.00', trend: 0 },
    power: { value: '0', trend: 0 },
    efficiency: { value: '0.0', trend: 0 }
  });
  const [currentLote, setCurrentLote] = useState<any>(null);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentLote) return;
      try {
        // Base dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Date strings for local comparison
        const pad = n => n.toString().padStart(2, '0');
        const getLocalDateString = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const todayStr = getLocalDateString(today);
        const yesterdayStr = getLocalDateString(yesterday);
        const tomorrowStr = getLocalDateString(tomorrow);

        // --- TEMPERATURE ---
        const todayMeasurements = await medicionAmbientalService.getMedicionesByLoteAndRango(
          currentLote.lote_id, todayStr + 'T00:00:00', tomorrowStr + 'T00:00:00'
        );
        const yesterdayMeasurements = await medicionAmbientalService.getMedicionesByLoteAndRango(
          currentLote.lote_id, yesterdayStr + 'T00:00:00', todayStr + 'T00:00:00'
        );
        const avgTemp = getAvg(todayMeasurements, 'temperatura');
        const yesterdayAvg = yesterdayMeasurements.length ? getAvg(yesterdayMeasurements, 'temperatura') : avgTemp;
        const tempTrend = yesterdayAvg !== 0 ? Number(((avgTemp - yesterdayAvg) / yesterdayAvg * 100).toFixed(2)) : 0;

        // --- WATER & POWER CONSUMPTION ---
        const consumos = await consumoService.getConsumosByLote(currentLote.lote_id);
        const todayFiltered = consumos.filter(record => {
          const fecha = new Date(record.fecha_hora);
          return fecha >= today && fecha < tomorrow;
        });
        const yesterdayFiltered = consumos.filter(record => {
          const fecha = new Date(record.fecha_hora);
          return fecha >= yesterday && fecha < today;
        });
        console.log('Today filtered consumos:', todayFiltered);
        const todayWater = getAvg(todayFiltered, 'cantidad_agua');
        const todayPower = getAvg(todayFiltered, 'kwh');
        const yesterdayWater = yesterdayFiltered.length ? getAvg(yesterdayFiltered, 'cantidad_agua') : todayWater;
        const yesterdayPower = yesterdayFiltered.length ? getAvg(yesterdayFiltered, 'kwh') : todayPower;
        const waterTrend = yesterdayWater !== 0 ? Number(((todayWater - yesterdayWater) / yesterdayWater * 100).toFixed(2)) : 0;
        const powerTrend = yesterdayPower !== 0 ? -Number(((todayPower - yesterdayPower) / yesterdayPower * 100).toFixed(2)) : 0;

        // --- GROWTH (WEIGHT) ---
        const crecimientos = await crecimientoService.getCrecimientosByLote(currentLote.lote_id);
        const todayWeights = crecimientos.filter(c => c.fecha === todayStr);
        const yesterdayWeights = crecimientos.filter(c => c.fecha === yesterdayStr);
        const latestWeight = getAvg(todayWeights, 'peso_promedio');
        const prevWeight = yesterdayWeights.length ? getAvg(yesterdayWeights, 'peso_promedio') : latestWeight;
        const weightTrend = prevWeight !== 0 ? Number(((latestWeight - prevWeight) / prevWeight * 100).toFixed(2)) : 0;

        // --- MORTALITY ---
        const mortalityData = await mortalidadService.getMortalidadesByLote(currentLote.lote_id);
        const todayMortality = mortalityData.reduce((sum, record) => {
          const recordDate = new Date(record.fecha);
          return recordDate.toDateString() === today.toDateString() ? sum + record.cantidad : sum;
        }, 0);
        const yesterdayMortality = mortalityData.reduce((sum, record) => {
          const recordDate = new Date(record.fecha);
          return recordDate.toDateString() === yesterday.toDateString() ? sum + record.cantidad : sum;
        }, 0);
        const mortalityTrend = yesterdayMortality ? ((todayMortality - yesterdayMortality) / yesterdayMortality) * 100 : 0;

        // --- PRODUCTIVE EFFICIENCY ---
        const growthRate = 0.15;
        const dayDiff = Math.floor((today.getTime() - new Date(currentLote.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const maxWeight = 2800;
        const midpoint = 20;
        const idealWeight = maxWeight / (1 + Math.exp(-growthRate * (dayDiff - midpoint)));
        const weightEfficiency = (latestWeight / idealWeight) * 100;
        const survivalRate = ((currentLote.cantidad_inicial - todayMortality) / currentLote.cantidad_inicial) * 100;
        const efficiency = (survivalRate * weightEfficiency) / 100;
        const prevEfficiency = 98;
        const efficiencyTrend = ((efficiency - prevEfficiency) / prevEfficiency) * 100;

        // --- SET STATE ---
        setStats({
          temperature: { value: avgTemp.toFixed(1), trend: tempTrend },
          water: { value: Math.round(todayWater).toString(), trend: waterTrend },
          mortality: { value: todayMortality.toString(), trend: -mortalityTrend },
          weight: { value: latestWeight.toFixed(2), trend: weightTrend },
          power: { value: Math.round(todayPower).toString(), trend: -powerTrend },
          efficiency: { value: efficiency.toFixed(1), trend: efficiencyTrend }
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchStats();
    const intervalId = setInterval(fetchStats, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [currentLote]);

  // Render
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
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <TemperatureMap />
        </div>
        <div className="lg:col-span-4">
          <EnvironmentalFactors />
        </div>
        <div className="lg:col-span-4">
          <MortalityChart />
        </div>
        <div className="lg:col-span-6">
          <GrowthChart />
        </div>
        <div className="lg:col-span-6">
          <ConsumptionChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
