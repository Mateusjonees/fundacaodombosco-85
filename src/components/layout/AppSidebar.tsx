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
  CheckSquare,
  Shield,
  Heart,
  ChevronLeft,
  ClipboardList,
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import logo from '@/assets/fundacao-dom-bosco-horizontal-logo.png';

// Map icon names to actual icon components
const iconMapping: Record<string, LucideIcon> = {
  Home,
  UserPlus,
  Users,
  Calendar,
  ClipboardList,
  UserCheck,
  FolderOpen,
  DollarSign,
  BarChart3,
  Package,
  Settings,
  Archive,
  CheckSquare,
  Shield,
  Heart,
};

// Dynamic menu items based on role permissions
const getMenuItemsForRole = (permissions: any) => {
  const items = [];
  
  // Painel - sempre visível para usuários autenticados
  items.push({ 
    id: 'dashboard', 
    title: 'Painel', 
    url: '/', 
    icon: 'Home', 
    order_index: 0 
  });

  // Pacientes - baseado em permissões
  if (permissions.canViewAllClients() || permissions.isProfessional()) {
    items.push({ 
      id: 'clients', 
      title: 'Pacientes',
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

  // Validação de Atendimentos - coordenadores e diretores
  if (permissions.isDirector() || permissions.isCoordinator()) {
    items.push({ 
      id: 'attendance-validation', 
      title: 'Validar Atendimentos', 
      url: '/attendance-validation', 
      icon: 'CheckSquare', 
      order_index: 3.5
    });
  }

  // Agenda - baseado em permissões
  if (permissions.canViewAllSchedules() || permissions.isProfessional()) {
    items.push({ 
      id: 'schedule', 
      title: 'Agenda', 
      url: '/schedule', 
      icon: 'Calendar', 
      order_index: 4 
    });
  }

  // Controle de Agendamentos - apenas coordenadores e diretores
  if (permissions.isDirector() || permissions.isCoordinator()) {
    items.push({ 
      id: 'schedule-control', 
      title: 'Controle de Agendamentos', 
      url: '/schedule-control', 
      icon: 'ClipboardList', 
      order_index: 4.5
    });
  }

  // Financeiro - apenas diretor e financeiro
  if (permissions.canAccessFinancial()) {
    items.push({ 
      id: 'financial', 
      title: 'Financeiro', 
      url: '/financial', 
      icon: 'DollarSign', 
      order_index: 5 
    });
  }

  // Contratos - apenas diretores e coordenadores do Floresta
  if (permissions.userRole === 'director' || permissions.userRole === 'coordinator_floresta') {
    items.push({ 
      id: 'contracts', 
      title: 'Contratos - Floresta', 
      url: '/contracts', 
      icon: 'FolderOpen', 
      order_index: 6 
    });
  }

  // Estoque - apenas diretor e financeiro
  if (permissions.canManageStock()) {
    items.push({ 
      id: 'stock', 
      title: 'Estoque', 
      url: '/stock', 
      icon: 'Package', 
      order_index: 7 
    });
  }

  // Relatórios - coordenadores e diretores
  if (permissions.canViewReports()) {
    items.push({ 
      id: 'reports', 
      title: 'Relatórios', 
      url: '/reports', 
      icon: 'BarChart3', 
      order_index: 8 
    });
  }

  // Funcionários - coordenadores e diretores
  if (permissions.canManageEmployees()) {
    items.push({ 
      id: 'employees', 
      title: 'Funcionários', 
      url: '/employees-new', 
      icon: 'UserPlus', 
      order_index: 9
    });
  }

  // Usuários - apenas diretores
  if (permissions.canManageUsers?.()) {
    items.push({ 
      id: 'users', 
      title: 'Usuários', 
      url: '/users', 
      icon: 'Shield', 
      order_index: 10 
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
  }, [permissions.loading, permissions.userRole]);

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
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent className="bg-white border-r border-gray-200">
        <SidebarGroup>
          {/* Logo Header */}
          <div className="flex items-center justify-center px-4 py-6 border-b border-gray-100">
            {!collapsed ? (
              <img 
                src={logo} 
                alt="Fundação Dom Bosco" 
                className="h-12 w-auto transition-all duration-300"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-[#1976D2] to-[#66BB6A] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FD</span>
              </div>
            )}
          </div>
          
          <div className="px-3 py-4">
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Menu Principal
              </SidebarGroupLabel>
            )}
          </div>
          
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = iconMapping[item.icon];
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive 
                              ? 'bg-gradient-to-r from-[#1976D2]/10 to-[#66BB6A]/10 text-[#1976D2] font-medium shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } ${collapsed ? 'justify-center' : ''}`
                        }
                      >
                        {IconComponent && (
                          <IconComponent className={`h-5 w-5 ${collapsed ? '' : 'mr-0'}`} />
                        )}
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Logout Section */}
        <SidebarGroup className="mt-auto border-t border-gray-100 pt-4">
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button 
                    onClick={handleLogout}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 w-full ${collapsed ? 'justify-center' : 'text-left'}`}
                  >
                    <LogOut className="h-5 w-5" />
                    {!collapsed && <span className="text-sm font-medium">Sair do Sistema</span>}
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