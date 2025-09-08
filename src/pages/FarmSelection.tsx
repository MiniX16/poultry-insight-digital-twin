import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFarm } from '@/context/FarmContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Building2, Plus } from 'lucide-react';
import { granjaService } from '@/lib/services/granjaService';
import { Farm } from '@/types/farm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NewFarmDialog } from '@/components/farm/NewFarmDialog';

const FarmSelection: React.FC = () => {
  const { user, logout } = useAuth();
  const { setSelectedFarm } = useFarm();
  const navigate = useNavigate();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localSelectedFarm, setLocalSelectedFarm] = useState<Farm | null>(null);
  const [isNewFarmDialogOpen, setIsNewFarmDialogOpen] = useState(false);

  useEffect(() => {
    const loadUserFarms = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const userFarms = await granjaService.getGranjasByUsuario(user.usuario_id);
        setFarms(userFarms);
      } catch (err) {
        console.error('Error loading farms:', err);
        setError('Error al cargar las granjas. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFarms();
  }, [user, navigate]);

  const refreshFarms = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userFarms = await granjaService.getGranjasByUsuario(user.usuario_id);
      setFarms(userFarms);
    } catch (err) {
      console.error('Error loading farms:', err);
      setError('Error al cargar las granjas. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFarm = (farm: Farm) => {
    setLocalSelectedFarm(farm);
    setSelectedFarm(farm); // This will also update localStorage
    // Navigate to dashboard
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-lg text-muted-foreground">Cargando tus granjas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Seleccionar Granja</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenido, {user?.nombre}. Selecciona la granja que deseas gestionar.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsNewFarmDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nueva Granja
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {farms.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No tienes granjas registradas
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Parece que aún no tienes granjas registradas. Crea tu primera granja para comenzar a gestionar tus operaciones avícolas.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => setIsNewFarmDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear Primera Granja
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Mis Granjas
              </h2>
              <p className="text-lg text-muted-foreground">
                Selecciona la granja que deseas gestionar
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {farms.map((farm) => (
                <Card 
                  key={farm.granja_id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                    localSelectedFarm?.granja_id === farm.granja_id 
                      ? 'ring-2 ring-blue-500 border-blue-300' 
                      : 'hover:border-blue-200'
                  }`}
                  onClick={() => handleSelectFarm(farm)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-6 w-6 text-blue-600" />
                        <CardTitle className="text-xl">{farm.nombre}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        ID: {farm.granja_id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {farm.ubicacion && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{farm.ubicacion}</span>
                        </div>
                      )}
                      {farm.descripcion && (
                        <CardDescription className="text-sm">
                          {farm.descripcion}
                        </CardDescription>
                      )}
                      <div className="pt-4">
                        <Button 
                          className="w-full"
                          variant={localSelectedFarm?.granja_id === farm.granja_id ? "default" : "outline"}
                        >
                          {localSelectedFarm?.granja_id === farm.granja_id ? 'Seleccionada' : 'Seleccionar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
      
      <NewFarmDialog 
        open={isNewFarmDialogOpen}
        onOpenChange={setIsNewFarmDialogOpen}
        onFarmCreated={refreshFarms}
      />
    </div>
  );
};

export default FarmSelection;