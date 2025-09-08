
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  Gauge,
  ThermometerSun,
  Layers3,
  Droplets,
  Timer,
  PowerIcon,
  Battery,
  ArrowDown,
  Plus,
  Radio
} from "lucide-react";
import { useLocation } from 'react-router-dom';
import { NewSensorDialog } from '@/components/sensors/NewSensorDialog';

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isSensorDialogOpen, setIsSensorDialogOpen] = useState(false);

  const menuItems = [
    { icon: Gauge, label: "Dashboard", path: "/dashboard" },
    { icon: ThermometerSun, label: "Ambiente", path: "/environmental" },
    { icon: Layers3, label: "Alimentación", path: "/feeding" },
    { icon: ArrowDown, label: "Mortandad", path: "/mortality" },
    { icon: Timer, label: "Peso y Crecimiento", path: "/growth" },
    { icon: PowerIcon, label: "Consumos", path: "/consumption" },
    { icon: Droplets, label: "Gemelo Digital", path: "/digital-twin" }
  ];

  const dataEntryItems = [
    { icon: Plus, label: "Entrada de Datos", path: "/data-entry", type: 'navigation' },
    { icon: Radio, label: "Nuevo Sensor", action: () => setIsSensorDialogOpen(true), type: 'action' }
  ];

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitoreo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild tooltip={item.label} isActive={isActive(item.path)}>
                    <NavLink to={item.path}>
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestión de Datos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dataEntryItems.map((item, index) => (
                <SidebarMenuItem key={item.path || index}>
                  {item.type === 'navigation' ? (
                    <SidebarMenuButton asChild tooltip={item.label} isActive={isActive(item.path!)}>
                      <NavLink to={item.path!}>
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton tooltip={item.label} onClick={item.action}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <NewSensorDialog 
        open={isSensorDialogOpen} 
        onOpenChange={setIsSensorDialogOpen} 
      />
    </Sidebar>
  );
}

export default AppSidebar;
