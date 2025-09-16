import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, AlertCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { loteService } from '@/lib/services/loteService';
import { polloService } from '@/lib/services/polloService';
import { consumoService } from '@/lib/services/consumoService';
import { alimentacionService } from '@/lib/services/alimentacionService';
import { crecimientoService } from '@/lib/services/crecimientoService';
import { medicionAmbientalService } from '@/lib/services/medicionAmbientalService';
import { mortalidadService } from '@/lib/services/mortalidadService';

type TableType = 'lote' | 'pollo' | 'consumo' | 'alimentacion' | 'crecimiento' | 'medicion_ambiental' | 'mortalidad';

interface RecentRecordsTableProps {
  tableType: TableType;
  title: string;
}

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return dateString;
  }
};

const formatDateOnly = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  } catch {
    return dateString;
  }
};

export function RecentRecordsTable({ tableType, title }: RecentRecordsTableProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRecentRecords();
  }, [tableType]);

  const loadRecentRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      switch (tableType) {
        case 'lote':
          data = await loteService.getLastTenLotes();
          break;
        case 'pollo':
          data = await polloService.getLastTenPollos();
          break;
        case 'consumo':
          data = await consumoService.getLastTenConsumos();
          break;
        case 'alimentacion':
          data = await alimentacionService.getLastTenAlimentaciones();
          break;
        case 'crecimiento':
          data = await crecimientoService.getLastTenCrecimientos();
          break;
        case 'medicion_ambiental':
          data = await medicionAmbientalService.getLastTenMedicionesAmbientales();
          break;
        case 'mortalidad':
          data = await mortalidadService.getLastTenMortalidades();
          break;
        default:
          throw new Error('Tipo de tabla no válido');
      }

      setRecords(data || []);
    } catch (err) {
      console.error('Error loading recent records:', err);
      setError('Error al cargar los registros recientes');
    } finally {
      setLoading(false);
    }
  };

  const getRecordId = (record: any) => {
    switch (tableType) {
      case 'lote':
        return record.lote_id;
      case 'pollo':
        return record.pollo_id;
      case 'consumo':
        return record.consumo_id;
      case 'alimentacion':
        return record.alimentacion_id;
      case 'crecimiento':
        return record.crecimiento_id;
      case 'medicion_ambiental':
        return record.medicion_id;
      case 'mortalidad':
        return record.mortalidad_id;
      default:
        return null;
    }
  };

  const handleDelete = async (recordId: number) => {
    try {
      setDeleting(recordId);

      switch (tableType) {
        case 'lote':
          await loteService.deleteLote(recordId);
          break;
        case 'pollo':
          await polloService.deletePollo(recordId);
          break;
        case 'consumo':
          await consumoService.deleteConsumo(recordId);
          break;
        case 'alimentacion':
          await alimentacionService.deleteAlimentacion(recordId);
          break;
        case 'crecimiento':
          await crecimientoService.deleteCrecimiento(recordId);
          break;
        case 'medicion_ambiental':
          await medicionAmbientalService.deleteMedicionAmbiental(recordId);
          break;
        case 'mortalidad':
          await mortalidadService.deleteMortalidad(recordId);
          break;
        default:
          throw new Error('Tipo de tabla no válido');
      }

      // Remove the record from local state
      setRecords(prev => prev.filter(record => getRecordId(record) !== recordId));

      toast({
        title: "Éxito",
        description: "Registro eliminado correctamente",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: `Error al eliminar el registro: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8">
            Cargando registros recientes...
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (records.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
            No hay registros recientes
          </TableCell>
        </TableRow>
      );
    }

    return records.map((record, index) => {
      const recordId = getRecordId(record);
      return (
        <TableRow key={index} className="group hover:bg-muted/50">
          {renderRowContent(record)}
          <TableCell className="w-12">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                  disabled={deleting === recordId}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El registro será eliminado permanentemente de la base de datos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => recordId && handleDelete(recordId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TableCell>
        </TableRow>
      );
    });
  };

  const renderRowContent = (record: any) => {
    switch (tableType) {
      case 'lote':
        return (
          <>
            <TableCell className="font-medium">{record.codigo}</TableCell>
            <TableCell>{record.granja?.nombre || 'N/A'}</TableCell>
            <TableCell>
              <Badge variant={record.estado === 'activo' ? 'default' : 'secondary'}>
                {record.estado}
              </Badge>
            </TableCell>
            <TableCell>{formatDateOnly(record.fecha_ingreso)}</TableCell>
          </>
        );

      case 'pollo':
        return (
          <>
            <TableCell className="font-medium">{record.identificador}</TableCell>
            <TableCell>{record.lote?.codigo || 'N/A'}</TableCell>
            <TableCell>{record.peso}g</TableCell>
            <TableCell>
              <Badge variant={record.estado_salud === 'saludable' ? 'default' : 'destructive'}>
                {record.estado_salud}
              </Badge>
            </TableCell>
          </>
        );

      case 'consumo':
        return (
          <>
            <TableCell className="font-medium">{record.lote?.codigo || 'N/A'}</TableCell>
            <TableCell>{record.cantidad_agua}L</TableCell>
            <TableCell>{record.cantidad_alimento}kg</TableCell>
            <TableCell>{formatDate(record.fecha_hora)}</TableCell>
          </>
        );

      case 'alimentacion':
        return (
          <>
            <TableCell className="font-medium">{record.lote?.codigo || 'N/A'}</TableCell>
            <TableCell>{record.tipo_alimento}</TableCell>
            <TableCell>{record.cantidad_suministrada}kg</TableCell>
            <TableCell>{formatDateOnly(record.fecha)}</TableCell>
          </>
        );

      case 'crecimiento':
        return (
          <>
            <TableCell className="font-medium">{record.lote?.codigo || 'N/A'}</TableCell>
            <TableCell>{record.peso_promedio}g</TableCell>
            <TableCell>-</TableCell>
            <TableCell>{formatDateOnly(record.fecha)}</TableCell>
          </>
        );

      case 'medicion_ambiental':
        return (
          <>
            <TableCell className="font-medium">{record.lote?.codigo || 'N/A'}</TableCell>
            <TableCell>{record.temperatura}°C</TableCell>
            <TableCell>{record.humedad}%</TableCell>
            <TableCell>{formatDate(record.fecha_hora)}</TableCell>
          </>
        );

      case 'mortalidad':
        return (
          <>
            <TableCell className="font-medium">{record.lote?.codigo || 'N/A'}</TableCell>
            <TableCell>{record.cantidad} aves</TableCell>
            <TableCell>{record.causa || 'No especificada'}</TableCell>
            <TableCell>{formatDateOnly(record.fecha)}</TableCell>
          </>
        );

      default:
        return null;
    }
  };

  const getTableHeaders = () => {
    let headers;
    switch (tableType) {
      case 'lote':
        headers = ['Código', 'Granja', 'Estado', 'Fecha Ingreso'];
        break;
      case 'pollo':
        headers = ['Identificador', 'Lote', 'Peso', 'Estado'];
        break;
      case 'consumo':
        headers = ['Lote', 'Agua', 'Alimento', 'Fecha'];
        break;
      case 'alimentacion':
        headers = ['Lote', 'Tipo', 'Cantidad', 'Fecha'];
        break;
      case 'crecimiento':
        headers = ['Lote', 'Peso Prom.', '', 'Fecha'];
        break;
      case 'medicion_ambiental':
        headers = ['Lote', 'Temperatura', 'Humedad', 'Fecha'];
        break;
      case 'mortalidad':
        headers = ['Lote', 'Cantidad', 'Causa', 'Fecha'];
        break;
      default:
        headers = [];
    }
    return [...headers, 'Acciones'];
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Últimos 10 registros de {title}
        </CardTitle>
        <CardDescription>
          Visualización de los registros más recientes para monitoreo rápido
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {getTableHeaders().map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}