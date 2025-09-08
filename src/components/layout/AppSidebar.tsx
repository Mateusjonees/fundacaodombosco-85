import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  UserPlus, 
  Package, 
  BarChart3, 
  UserCheck,
  ClipboardList,
  Home
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/components/auth/AuthProvider';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Cadastrar Cliente', url: '/clients', icon: Users },
  { title: 'Agenda do Dia', url: '/schedule', icon: Calendar },
  { title: 'Todos os Pacientes', url: '/all-patients', icon: ClipboardList },
  { title: 'Meus Pacientes', url: '/my-patients', icon: UserCheck },
  { title: 'Financeiro', url: '/financial', icon: DollarSign },
  { title: 'Relatórios', url: '/reports', icon: BarChart3 },
  { title: 'Estoque', url: '/stock', icon: Package },
  { title: 'Funcionários', url: '/employees', icon: UserPlus },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            FUNDAÇÃO DOM BOSCO
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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