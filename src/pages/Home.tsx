import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, BarChart3, Thermometer, Activity, TrendingUp } from 'lucide-react';
import LoginDialog from '@/components/auth/LoginDialog';
import RegisterDialog from '@/components/auth/RegisterDialog';

const Home: React.FC = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleSwitchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      title: "Dashboard Completo",
      description: "Monitorea todos tus indicadores clave en tiempo real"
    },
    {
      icon: <Thermometer className="h-8 w-8 text-red-500" />,
      title: "Control Ambiental",
      description: "Seguimiento de temperatura, humedad, CO2 y NH3"
    },
    {
      icon: <Activity className="h-8 w-8 text-green-500" />,
      title: "Gestión de Lotes",
      description: "Control integral de alimentación, crecimiento y mortalidad"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-500" />,
      title: "Análisis de Consumo",
      description: "Optimiza el uso de agua, electricidad y alimento"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Gemelo Digital
            <span className="text-blue-600 dark:text-blue-400 block">Avícola</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Optimiza tu producción avícola con tecnología de punta. Monitorea, analiza y mejora tus operaciones en tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setIsLoginOpen(true)}
              className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Iniciar Sesión
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setIsRegisterOpen(true)}
              className="text-lg px-8 py-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              Crear Cuenta
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Características Principales
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Nuestra plataforma te ofrece todas las herramientas necesarias para una gestión avícola eficiente y moderna.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 dark:bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            ¿Listo para optimizar tu producción?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Únete a los productores avícolas que ya están aprovechando el poder de los datos para mejorar sus resultados.
          </p>
          <Button 
            size="lg"
            onClick={() => setIsRegisterOpen(true)}
            className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Comenzar Ahora
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Authentication Dialogs */}
      <LoginDialog 
        open={isLoginOpen} 
        onOpenChange={setIsLoginOpen}
        onSwitchToRegister={handleSwitchToRegister}
      />
      
      <RegisterDialog 
        open={isRegisterOpen} 
        onOpenChange={setIsRegisterOpen}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

export default Home;