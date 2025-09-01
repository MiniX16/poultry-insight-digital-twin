import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useFarm } from '@/context/FarmContext';
import Home from '@/pages/Home';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedFarm, isLoading: farmLoading } = useFarm();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !farmLoading && isAuthenticated) {
      if (selectedFarm) {
        // User is authenticated and has selected a farm, redirect to dashboard
        navigate('/dashboard');
      } else {
        // User is authenticated but hasn't selected a farm, redirect to farm selection
        navigate('/farm-selection');
      }
    }
  }, [isAuthenticated, selectedFarm, isLoading, farmLoading, navigate]);

  // Show loading while checking authentication status
  if (isLoading || farmLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show the home page (landing page with login)
  return <Home />;
};

export default RootRedirect;