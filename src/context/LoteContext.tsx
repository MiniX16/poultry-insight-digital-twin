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
  const [currentLote, setCurrentLoteState] = useState<Lote | null>(null);
  const [availableLotes, setAvailableLotes] = useState<LoteWithGranja[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedFarm } = useFarm();

  // Wrapper function to save to localStorage when lote is manually selected
  const setCurrentLote = (lote: Lote | null) => {
    setCurrentLoteState(lote);
    if (lote) {
      localStorage.setItem('selectedLoteId', lote.lote_id.toString());
    } else {
      localStorage.removeItem('selectedLoteId');
    }
  };

  const refreshLotes = async () => {
    if (!selectedFarm) {
      setAvailableLotes([]);
      setCurrentLoteState(null);
      localStorage.removeItem('selectedLoteId');
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
      
      // Try to restore the previously selected lote
      const savedLoteId = localStorage.getItem('selectedLoteId');
      let loteToSelect: Lote | null = null;
      
      if (savedLoteId) {
        // Try to find the saved lote in the current farm's lotes
        loteToSelect = farmLotes.find(lote => lote.lote_id.toString() === savedLoteId) || null;
      }
      
      // If no saved lote or saved lote not found, select the first available lote
      if (!loteToSelect && farmLotes.length > 0) {
        loteToSelect = farmLotes[0];
      }
      
      // If current lote is not from this farm or we found a better candidate, update it
      if (!currentLote || 
          !farmLotes.some(lote => lote.lote_id === currentLote.lote_id) ||
          (loteToSelect && loteToSelect.lote_id !== currentLote.lote_id)) {
        setCurrentLoteState(loteToSelect);
        if (loteToSelect) {
          localStorage.setItem('selectedLoteId', loteToSelect.lote_id.toString());
        } else {
          localStorage.removeItem('selectedLoteId');
        }
      }
    } catch (error) {
      console.error('Error loading lotes for farm:', error);
      setAvailableLotes([]);
      setCurrentLoteState(null);
      localStorage.removeItem('selectedLoteId');
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
