
import React from 'react';
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
  ArrowDown
} from "lucide-react";
import { useLocation } from 'react-router-dom';

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { icon: Gauge, label: "Dashboard", path: "/dashboard" },
    { icon: ThermometerSun, label: "Ambiente", path: "/environmental" },
    { icon: Layers3, label: "Alimentación", path: "/feeding" },
    { icon: ArrowDown, label: "Mortandad", path: "/mortality" },
    { icon: Timer, label: "Peso y Crecimiento", path: "/growth" },
    { icon: PowerIcon, label: "Consumos", path: "/consumption" },
    { icon: Droplets, label: "Gemelo Digital", path: "/digital-twin" }
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
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
