
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Droplets, ThermometerSun, Timer, ArrowDown, Gauge, PowerIcon } from 'lucide-react';

// Generate mock data for simulation
const generateSimulationData = () => {
  const days = 42; // Full production cycle
  const data = [];
  
  // Function to generate sigmoid curve with randomness
  const sigmoid = (x, max, mid, rate) => {
    return max / (1 + Math.exp(-rate * (x - mid))) * (0.95 + Math.random() * 0.1);
  };
  
  // Start from day 1
  for (let day = 1; day <= days; day++) {
    // Simulated data with realistic correlations
    const weight = Math.round(sigmoid(day, 2800, 21, 0.2));
    const mortality = Math.round(5 + day * 0.8 * (0.9 + Math.random() * 0.2));
    const feedConsumption = Math.round(day < 5 ? day * 40 : 200 + day * 18) * (0.95 + Math.random() * 0.1);
    const waterConsumption = feedConsumption * (1.8 + Math.random() * 0.2);
    const temperature = Math.round((33 - day * 0.3) * 10) / 10;
    const electricUsage = 180 + day * 2 * (0.9 + Math.random() * 0.2);
    
    data.push({
      day,
      weight,
      mortality,
      feedConsumption,
      waterConsumption,
      temperature,
      electricUsage,
      fcr: (feedConsumption / weight).toFixed(2),
    });
  }
  
  return data;
};

// Generate environmental scenarios
const generateScenarios = () => {
  return [
    { 
      id: 1, 
      name: 'Óptimo', 
      description: 'Condiciones ideales de temperatura y ventilación',
      temperature: { min: 20, max: 24 },
      humidity: { min: 50, max: 65 },
      ventilation: 'Alta',
      impact: { mortality: -0.8, weight: 1.05, feedConsumption: 0.97 }
    },
    { 
      id: 2, 
      name: 'Estrés por calor', 
      description: 'Temperatura elevada prolongada',
      temperature: { min: 29, max: 33 },
      humidity: { min: 60, max: 75 },
      ventilation: 'Máxima',
      impact: { mortality: 1.4, weight: 0.92, feedConsumption: 0.85 }
    },
    { 
      id: 3, 
      name: 'Frío nocturno', 
      description: 'Temperatura baja durante la noche',
      temperature: { min: 16, max: 22 },
      humidity: { min: 45, max: 55 },
      ventilation: 'Baja',
      impact: { mortality: 1.1, weight: 0.96, feedConsumption: 1.08 }
    },
  ];
};

const DigitalTwinPage = () => {
  const [selectedDay, setSelectedDay] = useState(29); // Current day in simulation
  const [activeScenario, setActiveScenario] = useState(1); // Default scenario
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const simulationData = React.useMemo(() => generateSimulationData(), []);
  const scenarios = React.useMemo(() => generateScenarios(), []);
  
  // Get current day data
  const currentData = simulationData[selectedDay - 1];
  const scenarioData = scenarios.find(s => s.id === activeScenario);
  
  // Function to apply scenario modifiers to simulation data
  const getModifiedSimulation = (originalData, scenarioId) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return originalData;
    
    return originalData.map(day => {
      // Only apply modifications from current day forward
      if (day.day < selectedDay) return day;
      
      return {
        ...day,
        weight: Math.round(day.weight * scenario.impact.weight),
        mortality: Math.round(day.mortality * scenario.impact.mortality),
        feedConsumption: Math.round(day.feedConsumption * scenario.impact.feedConsumption),
      };
    });
  };
  
  // Get modified data based on active scenario
  const modifiedSimulation = getModifiedSimulation(simulationData, activeScenario);
  
  // Weekly summary data for the selected scenario
  const getWeeklySummary = () => {
    const weeks = [];
    for (let week = 1; week <= 6; week++) {
      const lastDayOfWeek = Math.min(week * 7, 42);
      const dataForWeek = modifiedSimulation[lastDayOfWeek - 1];
      weeks.push({
        week,
        day: lastDayOfWeek,
        weight: dataForWeek.weight,
        mortality: dataForWeek.mortality,
        fcr: dataForWeek.fcr,
      });
    }
    return weeks;
  };
  
  const weeklySummary = getWeeklySummary();
  
  const handleScenarioChange = (id) => {
    setActiveScenario(Number(id));
  };
  
  const handleTimelineChange = (event) => {
    setSelectedDay(Number(event.target.value));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gemelo Digital Avícola</h1>
        <div className="flex items-center bg-card rounded-full px-3 py-1 shadow-sm">
          <Droplets className="h-5 w-5 text-farm-teal mr-2" />
          <span className="font-medium">Lote: A-2023-14</span>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Línea temporal de simulación</CardTitle>
          <CardDescription>
            Día actual: {selectedDay} de 42
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="range"
              min="1"
              max="42"
              value={selectedDay}
              onChange={handleTimelineChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Inicio</span>
              <span>Semana 1</span>
              <span>Semana 2</span>
              <span>Semana 3</span>
              <span>Semana 4</span>
              <span>Semana 5</span>
              <span>Semana 6</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Escenarios</CardTitle>
              <CardDescription>
                Seleccione un escenario para simular
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scenarios.map((scenario) => (
                  <Button
                    key={scenario.id}
                    variant={activeScenario === scenario.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => handleScenarioChange(scenario.id)}
                  >
                    {scenario.name}
                  </Button>
                ))}
              </div>
              
              <div className="mt-4 bg-muted p-3 rounded-md">
                <h4 className="font-medium text-sm">{scenarioData.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{scenarioData.description}</p>
                
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Temperatura:</span>
                    <span>{scenarioData.temperature.min}°C - {scenarioData.temperature.max}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humedad:</span>
                    <span>{scenarioData.humidity.min}% - {scenarioData.humidity.max}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ventilación:</span>
                    <span>{scenarioData.ventilation}</span>
                  </div>
                </div>
                
                <div className="mt-3 space-y-1 text-sm">
                  <h5 className="font-medium">Impacto en:</h5>
                  <div className="flex justify-between">
                    <span>Mortandad:</span>
                    <span className={scenarioData.impact.mortality < 1 ? 'text-green-600' : 'text-red-600'}>
                      {scenarioData.impact.mortality < 1 ? '↓' : '↑'} 
                      {Math.abs((1 - scenarioData.impact.mortality) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peso:</span>
                    <span className={scenarioData.impact.weight > 1 ? 'text-green-600' : 'text-red-600'}>
                      {scenarioData.impact.weight > 1 ? '↑' : '↓'} 
                      {Math.abs((1 - scenarioData.impact.weight) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consumo:</span>
                    <span className={scenarioData.impact.feedConsumption < 1 ? 'text-green-600' : 'text-red-600'}>
                      {scenarioData.impact.feedConsumption < 1 ? '↓' : '↑'} 
                      {Math.abs((1 - scenarioData.impact.feedConsumption) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumen del Día {selectedDay}</CardTitle>
              <CardDescription>Valores actuales y proyectados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Timer className="h-5 w-5 text-farm-green" />
                <div>
                  <div className="text-sm font-medium">Peso Promedio</div>
                  <div className="text-2xl font-bold">{currentData.weight} g</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <ArrowDown className="h-5 w-5 text-farm-red" />
                <div>
                  <div className="text-sm font-medium">Mortandad Acumulada</div>
                  <div className="text-2xl font-bold">{currentData.mortality} aves</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Gauge className="h-5 w-5 text-farm-orange" />
                <div>
                  <div className="text-sm font-medium">Conv. Alimenticia</div>
                  <div className="text-2xl font-bold">{currentData.fcr}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <PowerIcon className="h-5 w-5 text-farm-purple" />
                <div>
                  <div className="text-sm font-medium">Consumo Eléctrico</div>
                  <div className="text-2xl font-bold">{currentData.electricUsage} kWh</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <ThermometerSun className="h-5 w-5 text-farm-blue" />
                <div>
                  <div className="text-sm font-medium">Temperatura</div>
                  <div className="text-2xl font-bold">{currentData.temperature}°C</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-3/4 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Proyección de Peso</CardTitle>
                  <CardDescription>Curva de crecimiento simulada</CardDescription>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Detalles</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Análisis de Crecimiento</DialogTitle>
                      <DialogDescription>
                        Comparación detallada de escenarios para proyección de peso
                      </DialogDescription>
                    </DialogHeader>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" label={{ value: 'Día', position: 'insideBottom', offset: -5 }} />
                          <YAxis label={{ value: 'Peso (g)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            data={simulationData} 
                            type="monotone" 
                            dataKey="weight" 
                            name="Escenario Estándar" 
                            stroke="#8B5CF6" 
                            strokeWidth={2} 
                          />
                          {scenarios.map((scenario) => {
                            if (scenario.id === 1) return null; // Skip default scenario
                            const modData = getModifiedSimulation(simulationData, scenario.id);
                            return (
                              <Line 
                                key={scenario.id}
                                data={modData} 
                                type="monotone" 
                                dataKey="weight" 
                                name={scenario.name} 
                                stroke={scenario.id === 2 ? "#EF4444" : "#10B981"} 
                                strokeWidth={2} 
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={modifiedSimulation} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      name="Peso Vivo (g)" 
                      stroke="#10B981" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="feedConsumption" 
                      name="Consumo Acum. (g/ave)" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Mortandad Proyectada</CardTitle>
                <CardDescription>Acumulada por día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modifiedSimulation} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="mortality" name="Mortandad (aves)" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Proyección de FCR</CardTitle>
                <CardDescription>Conversión alimenticia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={modifiedSimulation} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="fcr" 
                        name="FCR" 
                        stroke="#6366F1" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Resumen Semanal Proyectado</CardTitle>
                  <CardDescription>Escenario: {scenarioData.name}</CardDescription>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsDrawerOpen(true)}
                >
                  Ver Modelo 3D
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semana</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Peso Vivo</TableHead>
                    <TableHead>Mortandad Acum.</TableHead>
                    <TableHead>FCR</TableHead>
                    <TableHead>Uniformidad Est.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklySummary.map((week) => (
                    <TableRow key={week.week} className={week.day < selectedDay ? '' : 'text-muted-foreground'}>
                      <TableCell className="font-medium">{week.week}</TableCell>
                      <TableCell>{week.day}</TableCell>
                      <TableCell>{week.weight} g</TableCell>
                      <TableCell>{week.mortality} aves</TableCell>
                      <TableCell>{week.fcr}</TableCell>
                      <TableCell>{95 - week.week * 1.5}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 bg-muted p-4 rounded-md">
                <h4 className="font-medium">Proyección Final (Día 42)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Peso Final Promedio</div>
                    <div className="text-xl font-bold">{modifiedSimulation[41].weight} g</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Mortandad Total</div>
                    <div className="text-xl font-bold">{modifiedSimulation[41].mortality} aves ({(modifiedSimulation[41].mortality / 15000 * 100).toFixed(2)}%)</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">FCR Final</div>
                    <div className="text-xl font-bold">{modifiedSimulation[41].fcr}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Modelo 3D de la Granja</DrawerTitle>
            <DrawerDescription>
              Visualización espacial del gemelo digital con condiciones ambientales
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6">
            <div className="w-full h-64 bg-slate-100 rounded-md flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl text-muted-foreground mb-2">🐔</div>
                <p className="text-muted-foreground">Visualización 3D del modelo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  (Aquí se mostraría el modelo 3D interactivo de la granja)
                </p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted p-3 rounded-md">
                <h4 className="font-medium text-sm">Temperatura</h4>
                <div className="flex items-center mt-2">
                  <ThermometerSun className="h-5 w-5 text-farm-blue mr-2" />
                  <span className="text-lg font-bold">{currentData.temperature}°C</span>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <h4 className="font-medium text-sm">Humedad</h4>
                <div className="flex items-center mt-2">
                  <Droplets className="h-5 w-5 text-farm-teal mr-2" />
                  <span className="text-lg font-bold">{scenarioData.humidity.min + 5}%</span>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <h4 className="font-medium text-sm">Ventilación</h4>
                <div className="flex items-center mt-2">
                  <Gauge className="h-5 w-5 text-farm-orange mr-2" />
                  <span className="text-lg font-bold">{scenarioData.ventilation}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button className="w-full" onClick={() => setIsDrawerOpen(false)}>Cerrar Visualización</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default DigitalTwinPage;

