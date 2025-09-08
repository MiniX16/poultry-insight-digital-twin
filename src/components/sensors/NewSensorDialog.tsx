import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Radio, Thermometer, Droplets, Gauge, Battery, Wifi } from "lucide-react";

interface NewSensorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SensorType = 'temperatura' | 'humedad' | 'presion' | 'ph' | 'co2' | 'amoniaco';

const sensorTypes = [
  { value: 'temperatura', label: 'Temperatura', icon: Thermometer, unit: '°C' },
  { value: 'humedad', label: 'Humedad', icon: Droplets, unit: '%' },
  { value: 'presion', label: 'Presión Atmosférica', icon: Gauge, unit: 'hPa' },
  { value: 'ph', label: 'pH del Agua', icon: Droplets, unit: 'pH' },
  { value: 'co2', label: 'CO2', icon: Gauge, unit: 'ppm' },
  { value: 'amoniaco', label: 'Amoníaco', icon: Gauge, unit: 'ppm' }
] as const;

export function NewSensorDialog({ open, onOpenChange }: NewSensorDialogProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '' as SensorType | '',
    ubicacion: '',
    frecuencia_lectura: 5,
    rango_min: '',
    rango_max: '',
    descripcion: '',
    estado: 'activo' as 'activo' | 'inactivo'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: '' as SensorType | '',
      ubicacion: '',
      frecuencia_lectura: 5,
      rango_min: '',
      rango_max: '',
      descripcion: '',
      estado: 'activo'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.nombre.trim()) {
      toast({
        title: "Campo requerido",
        description: "El nombre del sensor es obligatorio.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.tipo) {
      toast({
        title: "Campo requerido",
        description: "El tipo de sensor es obligatorio.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.ubicacion.trim()) {
      toast({
        title: "Campo requerido",
        description: "La ubicación del sensor es obligatoria.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sensor creado",
        description: `Sensor "${formData.nombre}" configurado correctamente.`,
        variant: "default",
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el sensor. Inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSensorType = sensorTypes.find(type => type.value === formData.tipo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Configurar Nuevo Sensor
          </DialogTitle>
          <DialogDescription>
            Configure un nuevo sensor para monitorear las condiciones ambientales de la granja.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre del Sensor *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Ej: Sensor Temperatura Galpón 1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="tipo">Tipo de Sensor *</Label>
              <Select onValueChange={(value) => handleInputChange('tipo', value)} value={formData.tipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {sensorTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ubicacion">Ubicación *</Label>
              <Select onValueChange={(value) => handleInputChange('ubicacion', value)} value={formData.ubicacion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="galpon-1">Galpón 1</SelectItem>
                  <SelectItem value="galpon-2">Galpón 2</SelectItem>
                  <SelectItem value="galpon-3">Galpón 3</SelectItem>
                  <SelectItem value="galpon-4">Galpón 4</SelectItem>
                  <SelectItem value="bodega-alimento">Bodega de Alimento</SelectItem>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="exterior">Exterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="frecuencia_lectura">Frecuencia de Lectura (minutos)</Label>
              <Input
                id="frecuencia_lectura"
                type="number"
                min="1"
                max="60"
                value={formData.frecuencia_lectura}
                onChange={(e) => handleInputChange('frecuencia_lectura', parseInt(e.target.value))}
                placeholder="5"
              />
            </div>
          </div>

          {selectedSensorType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rango_min">Rango Mínimo ({selectedSensorType.unit})</Label>
                <Input
                  id="rango_min"
                  type="number"
                  step="0.1"
                  value={formData.rango_min}
                  onChange={(e) => handleInputChange('rango_min', e.target.value)}
                  placeholder={selectedSensorType.value === 'temperatura' ? '15' : '0'}
                />
              </div>
              
              <div>
                <Label htmlFor="rango_max">Rango Máximo ({selectedSensorType.unit})</Label>
                <Input
                  id="rango_max"
                  type="number"
                  step="0.1"
                  value={formData.rango_max}
                  onChange={(e) => handleInputChange('rango_max', e.target.value)}
                  placeholder={selectedSensorType.value === 'temperatura' ? '35' : '100'}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select onValueChange={(value) => handleInputChange('estado', value)} value={formData.estado}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Activo</span>
                  </div>
                </SelectItem>
                <SelectItem value="inactivo">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Inactivo</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Descripción adicional del sensor y su propósito..."
              rows={3}
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Configuración de Conectividad
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground">Protocolo:</span>
                <span className="font-medium">WiFi 2.4GHz / LoRaWAN</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Batería:</span>
                <div className="flex items-center gap-1">
                  <Battery className="h-3 w-3" />
                  <span className="font-medium">Litio 3.6V - 2 años</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              El sensor se sincronizará automáticamente con la plataforma una vez configurado.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Configurando..." : "Crear Sensor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewSensorDialog;