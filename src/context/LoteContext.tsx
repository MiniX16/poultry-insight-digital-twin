import React, { createContext, useState, useContext, useEffect } from 'react';
import { loteService } from '@/lib/services/loteService';
import { useFarm } from './FarmContext';
import type { Database } from '@/lib/database.types';

type Lote = Database['public']['Tables']['lote']['Row'];

type LoteWithGranja = Lote & { 
  granja: { 
    granja_id: number; 
    nombre: string; 
  } | null 
};

const LoteContext = createContext<{
  currentLote: Lote | null;
  setCurrentLote: (lote: Lote | null) => void;
  availableLotes: LoteWithGranja[];
  isLoading: boolean;
  refreshLotes: () => Promise<void>;
}>({
  currentLote: null,
  setCurrentLote: () => {},
  availableLotes: [],
  isLoading: false,
  refreshLotes: async () => {},
});

export const LoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLote, setCurrentLote] = useState<Lote | null>(null);
  const [availableLotes, setAvailableLotes] = useState<LoteWithGranja[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedFarm } = useFarm();

  const refreshLotes = async () => {
    if (!selectedFarm) {
      setAvailableLotes([]);
      setCurrentLote(null);
      return;
    }

    try {
      setIsLoading(true);
      const farmLotes = await loteService.getLotesByGranja(selectedFarm.granja_id);
      
      // Convert to LoteWithGranja format for consistency
      const lotesWithGranja: LoteWithGranja[] = farmLotes.map(lote => ({
        ...lote,
        granja: {
          granja_id: selectedFarm.granja_id,
          nombre: selectedFarm.nombre
        }
      }));
      
      setAvailableLotes(lotesWithGranja);
      
      // If current lote is not from this farm, clear it
      if (currentLote && currentLote.granja_id !== selectedFarm.granja_id) {
        setCurrentLote(null);
      }
    } catch (error) {
      console.error('Error loading lotes for farm:', error);
      setAvailableLotes([]);
      setCurrentLote(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Load lotes when selected farm changes
  useEffect(() => {
    refreshLotes();
  }, [selectedFarm]);

  return (
    <LoteContext.Provider value={{ 
      currentLote, 
      setCurrentLote, 
      availableLotes, 
      isLoading, 
      refreshLotes 
    }}>
      {children}
    </LoteContext.Provider>
  );
};

export const useLote = () => useContext(LoteContext);
