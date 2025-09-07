import React from 'react';
import { useLote } from '@/context/LoteContext';
import { Timer } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LoteSelector = ({ className = ''}: { className?: string }) => {
  const { currentLote, setCurrentLote, availableLotes } = useLote();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Timer className="h-4 w-4" />
        <span className="font-medium">Lote:</span>
      </div>
      <Select
        value={currentLote?.lote_id ? String(currentLote.lote_id) : ''}
        onValueChange={(value) => {
          const selected = availableLotes.find(l => String(l.lote_id) === value);
          setCurrentLote(selected || null);
        }}
      >
        <SelectTrigger className="w-[200px] h-8">
          <SelectValue placeholder="Seleccionar lote..." />
        </SelectTrigger>
        <SelectContent>
          {availableLotes.map(lote => (
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