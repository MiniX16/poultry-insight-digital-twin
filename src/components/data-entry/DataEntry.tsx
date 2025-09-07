import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLote } from "@/context/LoteContext";
import { useNavigate } from "react-router-dom";
import { 
  Thermometer,
  Building2, 
  Bird, 
  Droplets, 
  Utensils, 
  TrendingUp,
  Skull
} from "lucide-react";

import { granjaService } from '@/lib/services/granjaService';
import { loteService } from '@/lib/services/loteService';
import { polloService } from '@/lib/services/polloService';
import { consumoService } from '@/lib/services/consumoService';
import { alimentacionService } from '@/lib/services/alimentacionService';
import { crecimientoService } from '@/lib/services/crecimientoService';
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';
import { mortalidadService } from '@/lib/services/mortalidadService';

type TableType = 'granja' | 'lote' | 'pollo' | 'consumo' | 'alimentacion' | 'crecimiento' | 'medicion_ambiental' | 'mortalidad';

const tables = [
  { value: 'granja', label: 'Granja', icon: Building2, description: 'Registrar nuevas granjas' },
  { value: 'lote', label: 'Lote', icon: Bird, description: 'Crear lotes de pollos' },
  { value: 'pollo', label: 'Pollo', icon: Bird, description: 'Registrar pollos individuales' },
  { value: 'consumo', label: 'Consumo', icon: Droplets, description: 'Registrar datos de consumo' },
  { value: 'alimentacion', label: 'Alimentación', icon: Utensils, description: 'Registro de alimentación' },
  { value: 'crecimiento', label: 'Crecimiento', icon: TrendingUp, description: 'Datos de peso y crecimiento' },
  { value: 'medicion_ambiental', label: 'Ambiente', icon: Thermometer, description: 'Condiciones ambientales' },
  { value: 'mortalidad', label: 'Mortalidad', icon: Skull, description: 'Registros de mortalidad' }
] as const;

export function DataEntry() {
  const [selectedTable, setSelectedTable] = useState<TableType>('granja');
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [granjas, setGranjas] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { availableLotes } = useLote();
  const navigate = useNavigate();

  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      const [granjasData] = await Promise.all([
        granjaService.getAllGranjas()
      ]);
      
      setGranjas(granjasData);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields for granja
    if (selectedTable === 'granja') {
      if (!formData.nombre || formData.nombre.trim() === '') {
        toast({
          title: "Campo requerido",
          description: "El nombre de la granja es obligatorio.",
          variant: "destructive",
        });
        return;
      }
      if (!formData.capacidad || formData.capacidad <= 0) {
        toast({
          title: "Campo requerido",
          description: "La capacidad de la granja es obligatoria y debe ser mayor a 0.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      switch (selectedTable) {
        case 'granja':
          const granjaData = {
            ...formData,
            usuario_id: user?.usuario_id
          };
          await granjaService.createGranja(granjaData);
          break;
        case 'lote':
          await loteService.createLote(formData);
          break;
        case 'pollo':
          await polloService.createPollo(formData);
          break;
        case 'consumo':
          await consumoService.createConsumo(formData);
          break;
        case 'alimentacion':
          await alimentacionService.createAlimentacion(formData);
          break;
        case 'crecimiento':
          await crecimientoService.createCrecimiento(formData);
          break;
        case 'medicion_ambiental':
          await medicionAmbientalService.createMedicionAmbiental(formData);
          break;
        case 'mortalidad':
          await mortalidadService.createMortalidad(formData);
          break;
        default:
          throw new Error('Tipo de tabla no válido');
      }

      toast({
        title: "Éxito",
        description: "Datos guardados correctamente",
        variant: "default",
      });

      resetForm();
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: `Error al guardar los datos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    const currentTable = tables.find(table => table.value === selectedTable);
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentTable && <currentTable.icon className="h-5 w-5" />}
            Registrar {currentTable?.label}
          </CardTitle>
          <CardDescription>
            {currentTable?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFormFields()}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : `Crear ${currentTable?.label}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  const renderFormFields = () => {
    switch (selectedTable) {
      case 'granja':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre || ''}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Nombre de la granja"
                required
              />
            </div>
            <div>
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={formData.ubicacion || ''}
                onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                placeholder="Ubicación de la granja"
              />
            </div>
            <div>
              <Label htmlFor="capacidad">Capacidad *</Label>
              <Input
                id="capacidad"
                type="number"
                value={formData.capacidad || ''}
                onChange={(e) => handleInputChange('capacidad', parseInt(e.target.value))}
                placeholder="Capacidad total de aves"
                required
              />
            </div>
          </div>
        );

      case 'lote':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo || ''}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                placeholder="Código único del lote"
                required
              />
            </div>
            <div>
              <Label htmlFor="fecha_ingreso">Fecha de Ingreso *</Label>
              <Input
                id="fecha_ingreso"
                type="date"
                value={formData.fecha_ingreso || ''}
                onChange={(e) => handleInputChange('fecha_ingreso', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="cantidad_inicial">Cantidad Inicial *</Label>
              <Input
                id="cantidad_inicial"
                type="number"
                value={formData.cantidad_inicial || ''}
                onChange={(e) => handleInputChange('cantidad_inicial', parseInt(e.target.value))}
                placeholder="Número de pollos"
                required
              />
            </div>
            <div>
              <Label htmlFor="raza">Raza *</Label>
              <Input
                id="raza"
                value={formData.raza || ''}
                onChange={(e) => handleInputChange('raza', e.target.value)}
                placeholder="Raza de los pollos"
                required
              />
            </div>
            <div>
              <Label htmlFor="granja_id">Granja *</Label>
              <Select onValueChange={(value) => handleInputChange('granja_id', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la granja" />
                </SelectTrigger>
                <SelectContent>
                  {granjas.map((granja) => (
                    <SelectItem key={granja.granja_id} value={granja.granja_id.toString()}>
                      {granja.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estado">Estado *</Label>
              <Select onValueChange={(value) => handleInputChange('estado', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'pollo':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lote_id">Lote *</Label>
              <Select onValueChange={(value) => handleInputChange('lote_id', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el lote" />
                </SelectTrigger>
                <SelectContent>
                  {availableLotes.map((lote) => (
                    <SelectItem key={lote.lote_id} value={lote.lote_id.toString()}>
                      {lote.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="identificador">Identificador *</Label>
              <Input
                id="identificador"
                value={formData.identificador || ''}
                onChange={(e) => handleInputChange('identificador', e.target.value)}
                placeholder="Identificador único del pollo"
                required
              />
            </div>
            <div>
              <Label htmlFor="peso">Peso (g) *</Label>
              <Input
                id="peso"
                type="number"
                step="1"
                value={formData.peso || ''}
                onChange={(e) => handleInputChange('peso', parseFloat(e.target.value))}
                placeholder="Peso en gramos"
                required
              />
            </div>
            <div>
              <Label htmlFor="estado_salud">Estado de Salud *</Label>
              <Select onValueChange={(value) => handleInputChange('estado_salud', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado de salud" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saludable">Saludable</SelectItem>
                  <SelectItem value="enfermo">Enfermo</SelectItem>
                  <SelectItem value="recuperandose">Recuperándose</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'consumo':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lote_id">Lote *</Label>
              <Select onValueChange={(value) => handleInputChange('lote_id', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el lote" />
                </SelectTrigger>
                <SelectContent>
                  {availableLotes.map((lote) => (
                    <SelectItem key={lote.lote_id} value={lote.lote_id.toString()}>
                      {lote.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha_hora">Fecha y Hora *</Label>
              <Input
                id="fecha_hora"
                type="datetime-local"
                value={formData.fecha_hora || ''}
                onChange={(e) => handleInputChange('fecha_hora', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="cantidad_agua">Cantidad de Agua (L) *</Label>
              <Input
                id="cantidad_agua"
                type="number"
                step="0.01"
                value={formData.cantidad_agua || ''}
                onChange={(e) => handleInputChange('cantidad_agua', parseFloat(e.target.value))}
                placeholder="Litros de agua"
                required
              />
            </div>
            <div>
              <Label htmlFor="cantidad_alimento">Cantidad de Alimento (kg) *</Label>
              <Input
                id="cantidad_alimento"
                type="number"
                step="0.01"
                value={formData.cantidad_alimento || ''}
                onChange={(e) => handleInputChange('cantidad_alimento', parseFloat(e.target.value))}
                placeholder="Kilogramos de alimento"
                required
              />
            </div>
            <div>
              <Label htmlFor="tipo_alimento">Tipo de Alimento *</Label>
              <Input
                id="tipo_alimento"
                value={formData.tipo_alimento || ''}
                onChange={(e) => handleInputChange('tipo_alimento', e.target.value)}
                placeholder="Tipo de alimento"
                required
              />
            </div>
            <div>
              <Label htmlFor="desperdicio">Desperdicio (kg)</Label>
              <Input
                id="desperdicio"
                type="number"
                step="0.01"
                value={formData.desperdicio || ''}
                onChange={(e) => handleInputChange('desperdicio', parseFloat(e.target.value))}
                placeholder="Kilogramos de desperdicio"
              />
            </div>
            <div>
              <Label htmlFor="kwh">Consumo Eléctrico (kWh)</Label>
              <Input
                id="kwh"
                type="number"
                step="0.01"
                value={formData.kwh || ''}
                onChange={(e) => handleInputChange('kwh', parseFloat(e.target.value))}
                placeholder="Consumo eléctrico en kWh"
              />
            </div>
          </div>
        );

      case 'alimentacion':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lote_id">Lote *</Label>
              <Select onValueChange={(value) => handleInputChange('lote_id', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el lote" />
                </SelectTrigger>
                <SelectContent>
                  {availableLotes.map((lote) => (
                    <SelectItem key={lote.lote_id} value={lote.lote_id.toString()}>
                      {lote.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha || ''}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="tipo_alimento">Tipo de Alimento *</Label>
              <Input
                id="tipo_alimento"
                value={formData.tipo_alimento || ''}
                onChange={(e) => handleInputChange('tipo_alimento', e.target.value)}
                placeholder="Tipo de alimento"
                required
              />
            </div>
            <div>
              <Label htmlFor="cantidad_suministrada">Cantidad Suministrada (kg) *</Label>
              <Input
                id="cantidad_suministrada"
                type="number"
                step="0.01"
                value={formData.cantidad_suministrada || ''}
                onChange={(e) => handleInputChange('cantidad_suministrada', parseFloat(e.target.value))}
                placeholder="Kilogramos suministrados"
                required
              />
            </div>
            <div>
              <Label htmlFor="hora_suministro">Hora de Suministro *</Label>
              <Input
                id="hora_suministro"
                type="time"
                value={formData.hora_suministro || ''}
                onChange={(e) => handleInputChange('hora_suministro', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="responsable">Responsable *</Label>
              <Input
                id="responsable"
                value={formData.responsable || ''}
                onChange={(e) => handleInputChange('responsable', e.target.value)}
                placeholder="Nombre del responsable"
                required
              />
            </div>
          </div>
        );

      case 'crecimiento':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lote_id">Lote *</Label>
              <Select onValueChange={(value) => handleInputChange('lote_id', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el lote" />
                </SelectTrigger>
                <SelectContent>
                  {availableLotes.map((lote) => (
                    <SelectItem key={lote.lote_id} value={lote.lote_id.toString()}>
                      {lote.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha || ''}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="peso_promedio">Peso Promedio (g) *</Label>
              <Input
                id="peso_promedio"
                type="number"
                step="1"
                value={formData.peso_promedio || ''}
                onChange={(e) => handleInputChange('peso_promedio', parseFloat(e.target.value))}
                placeholder="Peso promedio en gramos"
                required
              />
            </div>
          </div>
        );

      case 'mortalidad':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lote_id">Lote *</Label>
              <Select onValueChange={(value) => handleInputChange('lote_id', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el lote" />
                </SelectTrigger>
                <SelectContent>
                  {availableLotes.map((lote) => (
                    <SelectItem key={lote.lote_id} value={lote.lote_id.toString()}>
                      {lote.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha || ''}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input
                id="cantidad"
                type="number"
                value={formData.cantidad || ''}
                onChange={(e) => handleInputChange('cantidad', parseInt(e.target.value))}
                placeholder="Número de aves"
                required
              />
            </div>
            <div>
              <Label htmlFor="causa">Causa</Label>
              <Input
                id="causa"
                value={formData.causa || ''}
                onChange={(e) => handleInputChange('causa', e.target.value)}
                placeholder="Causa de la mortalidad"
              />
            </div>
          </div>
        );

      case 'medicion_ambiental':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="lote_id">Lote *</Label>
              <Select onValueChange={(value) => handleInputChange('lote_id', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el lote" />
                </SelectTrigger>
                <SelectContent>
                  {availableLotes.map((lote) => (
                    <SelectItem key={lote.lote_id} value={lote.lote_id.toString()}>
                      {lote.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fecha_hora">Fecha y Hora *</Label>
              <Input
                id="fecha_hora"
                type="datetime-local"
                value={formData.fecha_hora || ''}
                onChange={(e) => handleInputChange('fecha_hora', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="temperatura">Temperatura (°C) *</Label>
              <Input
                id="temperatura"
                type="number"
                step="0.1"
                value={formData.temperatura || ''}
                onChange={(e) => handleInputChange('temperatura', parseFloat(e.target.value))}
                placeholder="24.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="humedad">Humedad (%) *</Label>
              <Input
                id="humedad"
                type="number"
                step="0.1"
                value={formData.humedad || ''}
                onChange={(e) => handleInputChange('humedad', parseFloat(e.target.value))}
                placeholder="65.0"
                required
              />
            </div>

            <div>
              <Label htmlFor="ubicacion">Ubicación *</Label>
              <Select onValueChange={(value) => handleInputChange('ubicacion', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar galpón" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="galpon-1">Galpón 1</SelectItem>
                  <SelectItem value="galpon-2">Galpón 2</SelectItem>
                  <SelectItem value="galpon-3">Galpón 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones || ''}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales sobre las condiciones ambientales..."
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar Datos</h1>
          <p className="text-muted-foreground">
            Ingrese los datos manualmente para mantener un registro actualizado de su granja.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
        {tables.map((table) => (
          <button
            key={table.value}
            onClick={() => {
              setSelectedTable(table.value);
              setFormData({}); // Reset form when switching tables
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTable === table.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <table.icon className="h-4 w-4" />
            {table.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderForm()}
    </div>
  );
}

export default DataEntry;