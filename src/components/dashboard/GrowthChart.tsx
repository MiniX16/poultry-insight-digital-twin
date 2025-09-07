import React, { useEffect, useState } from 'react';
import { useLote } from '@/context/LoteContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { crecimientoService } from '@/lib/services/crecimientoService';

type RegistroCrecimiento = {
  fecha: string;           // '2025-07-25'
  peso_promedio: number;   // 3.60
};

type DataDia = {
  fecha: string;  // formateada para mostrar en el eje X
  promedio: number;
};

const PesoPromedio7Dias = () => {
  const [data, setData] = useState<DataDia[]>([]);
  const { currentLote } = useLote();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentLote) return;

      try {
        const registros: RegistroCrecimiento[] = await crecimientoService.getCrecimientosByLote(currentLote.lote_id);

        // Agrupar por fecha (YYYY-MM-DD)
        const agrupados: Record<string, number[]> = {};
        registros.forEach(({ fecha, peso_promedio }) => {
          const fechaStr = new Date(fecha).toISOString().slice(0, 10);
          if (!agrupados[fechaStr]) agrupados[fechaStr] = [];
          agrupados[fechaStr].push(peso_promedio);
        });

        // Ordenar fechas y tomar las últimas 7
        const ultimasFechas = Object.keys(agrupados)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          .slice(-7);

        const resultado: DataDia[] = ultimasFechas.map(fechaISO => {
          const pesos = agrupados[fechaISO];
          const promedio = pesos.reduce((sum, p) => sum + p, 0) / pesos.length;
          return {
            fecha: new Date(fechaISO).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
            promedio: Math.round(promedio * 100) / 100
          };
        });

        setData(resultado);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      }
    };

    fetchData();
  }, [currentLote]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Peso Promedio Últimos 7 Días</CardTitle>
        <CardDescription>Visualización diaria</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" label={{ value: 'Fecha', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Peso (g)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="promedio"
                name="Peso Promedio"
                stroke="#14B8A6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PesoPromedio7Dias;
