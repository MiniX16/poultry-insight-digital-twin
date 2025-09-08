import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { granjaService } from '@/lib/services/granjaService';
import { Building2, MapPin, Users } from "lucide-react";

interface NewFarmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFarmCreated: () => void;
}

export function NewFarmDialog({ open, onOpenChange, onFarmCreated }: NewFarmDialogProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    capacidad: '',
    descripcion: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      ubicacion: '',
      capacidad: '',
      descripcion: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.nombre.trim()) {
      toast({
        title: "Campo requerido",
        description: "El nombre de la granja es obligatorio.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.capacidad || parseInt(formData.capacidad) <= 0) {
      toast({
        title: "Campo requerido",
        description: "La capacidad de la granja es obligatoria y debe ser mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const granjaData = {
        ...formData,
        capacidad: parseInt(formData.capacidad),
        usuario_id: user?.usuario_id
      };
      
      await granjaService.createGranja(granjaData);
      
      toast({
        title: "Granja creada",
        description: `Granja "${formData.nombre}" creada exitosamente.`,
        variant: "default",
      });

      resetForm();
      onOpenChange(false);
      onFarmCreated(); // Refresh the farms list
    } catch (error) {
      console.error('Error creating farm:', error);
      toast({
        title: "Error",
        description: `Error al crear la granja: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Crear Nueva Granja
          </DialogTitle>
          <DialogDescription>
            Registra una nueva granja para comenzar a gestionar tus operaciones avícolas.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="nombre">Nombre de la Granja *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Ej: Granja San Pedro"
              required
            />
          </div>

          <div>
            <Label htmlFor="ubicacion">Ubicación</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="ubicacion"
                value={formData.ubicacion}
                onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                placeholder="Ej: Km 15 Vía Bogotá - La Mesa"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="capacidad">Capacidad Total *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="capacidad"
                type="number"
                min="1"
                value={formData.capacidad}
                onChange={(e) => handleInputChange('capacidad', e.target.value)}
                placeholder="Número máximo de aves"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Descripción adicional de la granja..."
              rows={3}
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Información Adicional
            </h4>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">
                • La granja se asociará automáticamente a tu cuenta
              </p>
              <p className="text-muted-foreground">
                • Podrás crear lotes y gestionar pollos una vez creada
              </p>
              <p className="text-muted-foreground">
                • Todos los reportes y estadísticas estarán disponibles
              </p>
            </div>
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
              {isSubmitting ? "Creando..." : "Crear Granja"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewFarmDialog;