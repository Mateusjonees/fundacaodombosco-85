import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { 
  Users, 
  Calendar, 
  DollarSign, 
  UserPlus, 
  Package, 
  BarChart3, 
  UserCheck,
  Home,
  FolderOpen,
  LogOut,
  Settings,
  Archive,
  Shield,
  LucideIcon
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Map icon names to actual icon components
const iconMapping: Record<string, LucideIcon> = {
  Home,
  UserPlus,
  Users,
  Calendar,
  UserCheck,
  FolderOpen,
  DollarSign,
  BarChart3,
  Package,
  Settings,
  Archive,
  Shield,
};

// Static menu items based on user roles
const getMenuItemsForRole = (userRole: string | null) => {
  const baseItems = [
    { id: 'dashboard', title: 'Dashboard', url: '/', icon: 'Home', order_index: 0 },
    { id: 'clients', title: 'Clientes', url: '/clients', icon: 'Users', order_index: 1 },
    { id: 'schedule', title: 'Agenda', url: '/schedule', icon: 'Calendar', order_index: 2 },
  ];

  const coordinatorItems = [
    { id: 'financial', title: 'Financeiro', url: '/financial', icon: 'DollarSign', order_index: 3 },
    { id: 'contracts', title: 'Contratos', url: '/contracts', icon: 'FolderOpen', order_index: 4 },
    { id: 'stock', title: 'Estoque', url: '/stock', icon: 'Package', order_index: 5 },
    { id: 'reports', title: 'Relatórios', url: '/reports', icon: 'BarChart3', order_index: 6 },
    { id: 'employees', title: 'Funcionários', url: '/employees', icon: 'UserPlus', order_index: 7 },
  ];

  const directorItems = [
    { id: 'users', title: 'Usuários', url: '/users', icon: 'Shield', order_index: 8 },
  ];

  if (userRole === 'director') {
    return [...baseItems, ...coordinatorItems, ...directorItems];
  } else if (['coordinator_madre', 'coordinator_floresta'].includes(userRole || '')) {
    return [...baseItems, ...coordinatorItems];
  } else {
    return baseItems;
  }
};

interface MenuItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  order_index: number;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const [userRole, setUserRole] = useState<string | null>(null);
  const [navigationItems, setNavigationItems] = useState<MenuItem[]>([]);

  // Load user role
  useEffect(() => {
    const loadUserRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('employee_role')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        setUserRole(data.employee_role);
        setNavigationItems(getMenuItemsForRole(data.employee_role));
      } catch (error) {
        console.error('Error loading user role:', error);
        setNavigationItems(getMenuItemsForRole(null));
      }
    };

    loadUserRole();
  }, [user]);

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao fazer logout.",
      });
    }
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
            <div className="flex flex-col items-center p-4">
              {!collapsed && (
                <div className="text-center">
                  <div className="text-sm font-semibold text-primary">
                    Fundação Dom Bosco
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sistema de Gestão
                  </div>
                </div>
              )}
            </div>
          
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            MENU PRINCIPAL
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const IconComponent = iconMapping[item.icon];
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => getNavCls({ isActive })}
                      >
                        {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Logout Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Sair do Sistema</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}