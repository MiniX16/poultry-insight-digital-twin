
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoteProvider } from "@/context/LoteContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FarmProvider, useFarm } from "@/context/FarmContext";
import { useTheme } from "@/hooks/useTheme";

import AppLayout from "./components/layout/AppLayout";
import RootRedirect from "./components/RootRedirect";
import Home from "./pages/Home";
import FarmSelection from "./pages/FarmSelection";
import Dashboard from "./pages/Dashboard";
import EnvironmentalPage from "./pages/EnvironmentalPage";
import FeedingPage from "./pages/FeedingPage";
import MortalityPage from "./pages/MortalityPage";
import GrowthPage from "./pages/GrowthPage";
import ConsumptionPage from "./pages/ConsumptionPage";
import DigitalTwinPage from "./pages/DigitalTwinPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedFarm, isLoading: farmLoading } = useFarm();

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

  if (!isAuthenticated) {
    return <Home />;
  }

  if (!selectedFarm) {
    return <FarmSelection />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  useTheme();
  return (
    <FarmProvider>
      <NotificationProvider>
        <LoteProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/farm-selection" element={<FarmSelection />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/environmental" element={
                <ProtectedRoute>
                  <EnvironmentalPage />
                </ProtectedRoute>
              } />
              <Route path="/feeding" element={
                <ProtectedRoute>
                  <FeedingPage />
                </ProtectedRoute>
              } />
              <Route path="/mortality" element={
                <ProtectedRoute>
                  <MortalityPage />
                </ProtectedRoute>
              } />
              <Route path="/growth" element={
                <ProtectedRoute>
                  <GrowthPage />
                </ProtectedRoute>
              } />
              <Route path="/consumption" element={
                <ProtectedRoute>
                  <ConsumptionPage />
                </ProtectedRoute>
              } />
              <Route path="/digital-twin" element={
                <ProtectedRoute>
                  <DigitalTwinPage />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LoteProvider>
      </NotificationProvider>
    </FarmProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <AppContent />
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
