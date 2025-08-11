
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import SettingsMenu from "@/components/SettingsMenu";
import NotificationPanel from "@/components/NotificationPanel";
import UserMenu from "@/components/UserMenu";
import { useFarm } from "@/context/FarmContext";
import { Building2 } from "lucide-react";

const AppHeader = () => {
  const { selectedFarm } = useFarm();

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center">
        <SidebarTrigger className="mr-4" />
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-semibold">Gemelo Digital Avícola</h1>
          {selectedFarm && (
            <>
              <div className="h-4 w-px bg-border"></div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{selectedFarm.nombre}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <NotificationPanel />
        <SettingsMenu />
        <UserMenu />
      </div>
    </header>
  );
};

export default AppHeader;
