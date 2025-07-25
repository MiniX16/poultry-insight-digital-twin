import React, { createContext, useState, useContext } from 'react';

type Lote = {
  lote_id: number;
} | null;

const LoteContext = createContext<{
  currentLote: Lote;
  setCurrentLote: (lote: Lote) => void;
}>({
  currentLote: null,
  setCurrentLote: () => {},
});

export const LoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLote, setCurrentLote] = useState<Lote>(null);

  return (
    <LoteContext.Provider value={{ currentLote, setCurrentLote }}>
      {children}
    </LoteContext.Provider>
  );
};

export const useLote = () => useContext(LoteContext);
