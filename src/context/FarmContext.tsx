import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Farm } from '@/types/farm';
import { useAuth } from './AuthContext';

interface FarmContextType {
  selectedFarm: Farm | null;
  setSelectedFarm: (farm: Farm | null) => void;
  clearSelectedFarm: () => void;
  isLoading: boolean;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

interface FarmProviderProps {
  children: ReactNode;
}

export const FarmProvider: React.FC<FarmProviderProps> = ({ children }) => {
  const [selectedFarm, setSelectedFarmState] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Load selected farm from localStorage on mount and when user changes
  useEffect(() => {
    const loadSelectedFarm = () => {
      try {
        // If user is not authenticated, clear any selected farm
        if (!isAuthenticated) {
          setSelectedFarmState(null);
          setIsLoading(false);
          return;
        }

        const storedFarm = localStorage.getItem('selected-farm');
        if (storedFarm) {
          const farm = JSON.parse(storedFarm) as Farm;
          setSelectedFarmState(farm);
        } else {
          setSelectedFarmState(null);
        }
      } catch (error) {
        console.error('Error loading selected farm from localStorage:', error);
        localStorage.removeItem('selected-farm');
        setSelectedFarmState(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSelectedFarm();
  }, [user, isAuthenticated]);

  const setSelectedFarm = (farm: Farm | null) => {
    setSelectedFarmState(farm);
    if (farm) {
      localStorage.setItem('selected-farm', JSON.stringify(farm));
    } else {
      localStorage.removeItem('selected-farm');
    }
  };

  const clearSelectedFarm = () => {
    setSelectedFarmState(null);
    localStorage.removeItem('selected-farm');
  };

  return (
    <FarmContext.Provider value={{
      selectedFarm,
      setSelectedFarm,
      clearSelectedFarm,
      isLoading
    }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = (): FarmContextType => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};