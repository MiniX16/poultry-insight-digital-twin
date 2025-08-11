import { useEffect, useState } from 'react';
import { loteService } from '../../lib/services/loteService';
import type { Database } from '../../lib/database.types';

type Lote = Database['public']['Tables']['lote']['Row'] & {
  nave?: { nombre: string };
  proveedor?: { nombre: string };
};

export const LoteList = () => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const data = await loteService.getAllLotes();
        setLotes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los lotes');
      } finally {
        setLoading(false);
      }
    };

    fetchLotes();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-card">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-6 py-3 text-left">Código</th>
            <th className="px-6 py-3 text-left">Fecha Ingreso</th>
            <th className="px-6 py-3 text-left">Cantidad</th>
            <th className="px-6 py-3 text-left">Raza</th>
            <th className="px-6 py-3 text-left">Nave</th>
            <th className="px-6 py-3 text-left">Proveedor</th>
            <th className="px-6 py-3 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {lotes.map((lote) => (
            <tr key={lote.lote_id} className="border-b hover:bg-muted/50">
              <td className="px-6 py-4">{lote.codigo}</td>
              <td className="px-6 py-4">{new Date(lote.fecha_ingreso).toLocaleDateString()}</td>
              <td className="px-6 py-4">{lote.cantidad_inicial}</td>
              <td className="px-6 py-4">{lote.raza}</td>
              <td className="px-6 py-4">{lote.nave?.nombre || '-'}</td>
              <td className="px-6 py-4">{lote.proveedor?.nombre || '-'}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-sm ${
                  lote.estado === 'activo' ? 'bg-green-100 text-green-800' :
                  lote.estado === 'finalizado' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {lote.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 