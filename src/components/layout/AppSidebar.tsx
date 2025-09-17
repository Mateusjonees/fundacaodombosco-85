import { useState, useEffect } from 'react';
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
  Heart,
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
import { useRolePermissions } from '@/hooks/useRolePermissions';

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
  Heart,
};

// Dynamic menu items based on role permissions
const getMenuItemsForRole = (permissions: any) => {
  const items = [];
  
  // Dashboard - sempre visível para usuários autenticados
  items.push({ 
    id: 'dashboard', 
    title: 'Dashboard', 
    url: '/', 
    icon: 'Home', 
    order_index: 0 
  });

  // Clientes - baseado em permissões
  if (permissions.canViewAllClients() || permissions.isProfessional()) {
    items.push({ 
      id: 'clients', 
      title: 'Clientes', 
      url: '/clients', 
      icon: 'Users', 
      order_index: 1 
    });
  }

  // Meus Pacientes - apenas para profissionais e diretor
  if (permissions.canViewMyPatients()) {
    items.push({ 
      id: 'my-patients', 
      title: 'Meus Pacientes', 
      url: '/my-patients', 
      icon: 'Heart', 
      order_index: 2 
    });
  }

  // Agenda - baseado em permissões
  if (permissions.canViewAllSchedules() || permissions.isProfessional()) {
    items.push({ 
      id: 'schedule', 
      title: 'Agenda', 
      url: '/schedule', 
      icon: 'Calendar', 
      order_index: 3 
    });
  }

  // Financeiro - apenas diretor e financeiro
  if (permissions.canAccessFinancial()) {
    items.push({ 
      id: 'financial', 
      title: 'Financeiro', 
      url: '/financial', 
      icon: 'DollarSign', 
      order_index: 4 
    });
  }

  // Contratos - coordenadores e diretores
  if (permissions.isDirector() || permissions.isCoordinator()) {
    items.push({ 
      id: 'contracts', 
      title: 'Contratos', 
      url: '/contracts', 
      icon: 'FolderOpen', 
      order_index: 5 
    });
  }

  // Estoque - apenas diretor e financeiro
  if (permissions.canManageStock()) {
    items.push({ 
      id: 'stock', 
      title: 'Estoque', 
      url: '/stock', 
      icon: 'Package', 
      order_index: 6 
    });
  }

  // Relatórios - coordenadores e diretores
  if (permissions.canViewReports()) {
    items.push({ 
      id: 'reports', 
      title: 'Relatórios', 
      url: '/reports', 
      icon: 'BarChart3', 
      order_index: 7 
    });
  }

  // Funcionários - coordenadores e diretores
  if (permissions.canManageEmployees()) {
    items.push({ 
      id: 'employees', 
      title: 'Funcionários', 
      url: '/employees-new', 
      icon: 'UserPlus', 
      order_index: 8
    });
  }

  // Usuários - diretores e coordenadores
  if (permissions.canManageEmployees()) {
    items.push({ 
      id: 'users', 
      title: 'Usuários', 
      url: '/users', 
      icon: 'Shield', 
      order_index: 9 
    });
  }

  return items.sort((a, b) => a.order_index - b.order_index);
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
  const permissions = useRolePermissions();
  const currentPath = location.pathname;
  const [navigationItems, setNavigationItems] = useState<MenuItem[]>([]);

  // Load navigation items based on permissions
  useEffect(() => {
    if (!permissions.loading) {
      const items = getMenuItemsForRole(permissions);
      setNavigationItems(items);
    }
  }, [permissions]);

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