import React, { useEffect, useState } from 'react';
import { useLote } from '@/context/LoteContext';
import { Timer } from 'lucide-react';
import { loteService } from '@/lib/services/loteService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LoteSelector = ({ className = ''}: { className?: string }) => {
  const { currentLote, setCurrentLote } = useLote();
  const [lotes, setLotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const lotesData = await loteService.getAllLotes();
        setLotes(lotesData);
        if (lotesData.length > 0 && !currentLote) {
          setCurrentLote(lotesData[0]);
        }
      } catch (error) {
        console.error('Error fetching lotes:', error);
      }
    };
    fetchLotes();
  }, [setCurrentLote, currentLote]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Timer className="h-4 w-4" />
        <span className="font-medium">Lote:</span>
      </div>
      <Select
        value={currentLote?.lote_id ? String(currentLote.lote_id) : ''}
        onValueChange={(value) => {
          const selected = lotes.find(l => String(l.lote_id) === value);
          setCurrentLote(selected);
        }}
      >
        <SelectTrigger className="w-[200px] h-8">
          <SelectValue placeholder="Seleccionar lote..." />
        </SelectTrigger>
        <SelectContent>
          {lotes.map(lote => (
            <SelectItem key={lote.lote_id} value={String(lote.lote_id)}>
              <div className="flex items-center gap-2">
                <Timer className="h-3 w-3" />
                <span>{lote.codigo}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LoteSelector; 
