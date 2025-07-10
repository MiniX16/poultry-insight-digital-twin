import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { loteService } from '@/lib/services/loteService';

interface LoteSelectorProps {
  currentLote: any;
  setCurrentLote: (lote: any) => void;
  className?: string;
}

const LoteSelector: React.FC<LoteSelectorProps> = ({ currentLote, setCurrentLote, className = '' }) => {
  const [lotes, setLotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchLotes = async () => {
      const lotesData = await loteService.getAllLotes();
      setLotes(lotesData);
      if (lotesData.length > 0 && !currentLote) {
        setCurrentLote(lotesData[0]);
      }
    };
    fetchLotes();
  }, [setCurrentLote, currentLote]);

  return (
    <div className={`flex items-center bg-white rounded-full px-3 py-1 shadow-sm ${className}`}>
      <Timer className="h-5 w-5 text-farm-teal mr-2" />
      <select
        className="font-medium bg-transparent outline-none"
        value={currentLote?.lote_id || ''}
        onChange={e => {
          const selected = lotes.find(l => String(l.lote_id) === e.target.value);
          setCurrentLote(selected);
        }}
      >
        {lotes.map(lote => (
          <option key={lote.lote_id} value={lote.lote_id}>
            {lote.codigo}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LoteSelector; 