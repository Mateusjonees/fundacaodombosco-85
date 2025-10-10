import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '@/assets/fundacao-dom-bosco-logo-optimized.png';

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
  MessageSquare,
  FileCheck,
  FileText,
  Folder,
  Clock,
  Bell,
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
import { useCustomPermissions } from '@/hooks/useCustomPermissions';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  MessageSquare,
  FileCheck,
  FileText,
  Folder,
  Clock,
  Bell,
};

// Dynamic menu items based on role permissions
const getMenuItemsForRole = (permissions: any, customPermissions: any) => {
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
  if (permissions.canViewAllClients() || permissions.isProfessional() || customPermissions.hasPermission('view_clients')) {
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

  // Prontuários - profissionais, coordenadores e diretores
  if (permissions.isProfessional() || permissions.isCoordinator() || permissions.isDirector()) {
    items.push({ 
      id: 'medical-records', 
      title: 'Prontuários', 
      url: '/medical-records', 
      icon: 'FileText', 
      order_index: 2.5
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
  
  // Controle de Devolutiva - todos os funcionários autenticados
  items.push({ 
    id: 'feedback-control', 
    title: 'Controle de Devolutiva', 
    url: '/feedback-control', 
    icon: 'FileCheck', 
    order_index: 3.7
  });

  // Agenda - baseado em permissões
  if (permissions.canViewAllSchedules() || permissions.isProfessional() || customPermissions.hasPermission('view_schedules')) {
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

  // Alertas de Reunião - coordenadores e diretores
  if (permissions.isDirector() || permissions.isCoordinator()) {
    items.push({ 
      id: 'meeting-alerts', 
      title: 'Alertas de Reunião', 
      url: '/meeting-alerts', 
      icon: 'Bell', 
      order_index: 4.7
    });
  }

  // Financeiro - apenas diretor e financeiro OU com permissão customizada
  if (permissions.canAccessFinancial() || customPermissions.hasPermission('view_financial')) {
    items.push({ 
      id: 'financial', 
      title: 'Financeiro', 
      url: '/financial', 
      icon: 'DollarSign', 
      order_index: 5 
    });
  }

  // Contratos - diretores, coordenadores do Floresta OU com permissão customizada
  const hasContractsPermission = customPermissions.hasPermission('view_contracts');
  console.log('🔍 Verificando acesso a Contratos:', {
    isDirector: permissions.userRole === 'director',
    isCoordinatorFloresta: permissions.userRole === 'coordinator_floresta',
    hasCustomPermission: hasContractsPermission,
    userRole: permissions.userRole
  });
  
  if (permissions.userRole === 'director' || permissions.userRole === 'coordinator_floresta' || hasContractsPermission) {
    console.log('✅ LIBERADO: Adicionando menu Contratos');
    items.push({ 
      id: 'contracts', 
      title: 'Contratos - Floresta', 
      url: '/contracts', 
      icon: 'FolderOpen', 
      order_index: 6 
    });
  } else {
    console.log('❌ BLOQUEADO: Não adicionando menu Contratos');
  }

  // Estoque - apenas diretor e financeiro OU com permissão customizada
  if (permissions.canManageStock() || customPermissions.hasPermission('view_stock')) {
    items.push({ 
      id: 'stock', 
      title: 'Estoque', 
      url: '/stock', 
      icon: 'Package', 
      order_index: 7 
    });
  }

  // Relatórios - coordenadores e diretores OU com permissão customizada
  if (permissions.canViewReports() || customPermissions.hasPermission('view_reports')) {
    items.push({ 
      id: 'reports', 
      title: 'Relatórios', 
      url: '/reports', 
      icon: 'BarChart3', 
      order_index: 8 
    });
  }

  // Funcionários - coordenadores e diretores OU com permissão customizada
  if (permissions.canManageEmployees() || customPermissions.hasPermission('view_employees')) {
    items.push({ 
      id: 'employees', 
      title: 'Funcionários', 
      url: '/employees-new', 
      icon: 'UserPlus', 
      order_index: 9
    });
  }

  // Controle de Funcionários - apenas diretores
  if (permissions.isDirector()) {
    items.push({ 
      id: 'employee-control', 
      title: 'Controle de Funcionários', 
      url: '/employee-control', 
      icon: 'UserCheck', 
      order_index: 9.5
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

  // Mensagens - todos os usuários autenticados
  items.push({ 
    id: 'messages', 
    title: 'Mensagens', 
    url: '/messages', 
    icon: 'MessageSquare', 
    order_index: 11 
  });

  // Meus Arquivos - todos os usuários autenticados
  items.push({ 
    id: 'my-files', 
    title: 'Meus Arquivos', 
    url: '/my-files', 
    icon: 'Folder', 
    order_index: 12 
  });

  // Ponto Eletrônico - todos os usuários autenticados
  items.push({ 
    id: 'timesheet', 
    title: 'Ponto Eletrônico', 
    url: '/timesheet', 
    icon: 'Clock', 
    order_index: 13 
  });

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
  const { state, setOpen, isMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const permissions = useRolePermissions();
  const customPermissions = useCustomPermissions();
  const currentPath = location.pathname;
  const [navigationItems, setNavigationItems] = useState<MenuItem[]>([]);

  console.log('🎯 AppSidebar Render:', {
    userRole: permissions.userRole,
    roleLoading: permissions.loading,
    customLoading: customPermissions.loading,
    customPermissionsCount: customPermissions.permissions.length,
    customPermissions: customPermissions.permissions,
    userId: user?.id
  });

  // Load navigation items based on permissions
  useEffect(() => {
    console.log('📊 useEffect executado:', {
      roleLoading: permissions.loading,
      customLoading: customPermissions.loading,
      shouldUpdate: !permissions.loading && !customPermissions.loading
    });
    
    if (!permissions.loading && !customPermissions.loading) {
      console.log('✅ Atualizando menu com permissões:', {
        rolePermissions: permissions.userRole,
        customPermissions: customPermissions.permissions
      });
      const items = getMenuItemsForRole(permissions, customPermissions);
      console.log('📋 Items do menu gerados:', items.map(i => i.title));
      setNavigationItems(items);
    }
  }, [permissions.loading, permissions.userRole, customPermissions.loading, customPermissions.permissions]);

  // Fechar sidebar automaticamente em mobile após navegar
  useEffect(() => {
    if (isMobile && state === 'expanded') {
      setOpen(false);
    }
  }, [currentPath, isMobile]);

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
    <Sidebar className={collapsed ? "w-14" : "w-60 md:w-60"}>
      <SidebarContent>
        <SidebarGroup>
            <div className="flex flex-col items-center p-4 border-b">
              {!collapsed ? (
                <div className="text-center space-y-3">
                  <img 
                    src={logo} 
                    alt="Fundação Dom Bosco" 
                    className="h-16 md:h-20 w-auto object-contain mx-auto"
                    width="84"
                    height="64"
                  />
                  <div className="hidden md:block">
                    <div className="text-xs font-semibold text-primary">
                      Sistema de Gestão
                    </div>
                  </div>
                </div>
              ) : (
                <img 
                  src={logo} 
                  alt="Fundação Dom Bosco" 
                  className="h-8 w-auto object-contain"
                  width="42"
                  height="32"
                />
              )}
            </div>
          
          <div className="flex items-center justify-between px-3 py-2">
            <SidebarGroupLabel className={collapsed ? "sr-only" : "text-xs md:text-sm"}>
              MENU
            </SidebarGroupLabel>
          </div>
          
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
        <SidebarGroup className="mt-auto border-t">
          <SidebarGroupContent className="space-y-1 py-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <ThemeToggle collapsed={collapsed} />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {!collapsed && <span className="text-sm">Sair</span>}
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