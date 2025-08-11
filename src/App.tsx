
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoteProvider } from "@/context/LoteContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { useTheme } from "@/hooks/useTheme";

import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import EnvironmentalPage from "./pages/EnvironmentalPage";
import FeedingPage from "./pages/FeedingPage";
import MortalityPage from "./pages/MortalityPage";
import GrowthPage from "./pages/GrowthPage";
import ConsumptionPage from "./pages/ConsumptionPage";
import DigitalTwinPage from "./pages/DigitalTwinPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  useTheme();
  return (
    <NotificationProvider>
      <LoteProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/environmental" element={<EnvironmentalPage />} />
            <Route path="/feeding" element={<FeedingPage />} />
            <Route path="/mortality" element={<MortalityPage />} />
            <Route path="/growth" element={<GrowthPage />} />
            <Route path="/consumption" element={<ConsumptionPage />} />
            <Route path="/digital-twin" element={<DigitalTwinPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </LoteProvider>
    </NotificationProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
