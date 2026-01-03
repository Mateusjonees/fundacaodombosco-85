import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '@/assets/fundacao-dom-bosco-logo-optimized.png';
import { 
  Users, Calendar, DollarSign, UserPlus, Package, BarChart3, UserCheck, 
  Home, FolderOpen, LogOut, Settings, Archive, CheckSquare, Shield, Heart, 
  ClipboardList, MessageSquare, FileCheck, FileText, Folder, Clock, Bell, Brain, 
  LucideIcon, ChevronRight, Tag
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useCustomPermissions } from '@/hooks/useCustomPermissions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Map icon names to actual icon components
const iconMapping: Record<string, LucideIcon> = {
  Home, UserPlus, Users, Calendar, ClipboardList, UserCheck, FolderOpen, 
  DollarSign, BarChart3, Package, Settings, Archive, CheckSquare, Shield, 
  Heart, MessageSquare, FileCheck, FileText, Folder, Clock, Bell, Brain, Tag
};

// Dynamic menu items based on role permissions
const getMenuItemsForRole = (permissions: any, customPermissions: any) => {
  const items = [];

  // Painel - sempre visível
  items.push({
    id: 'dashboard',
    title: 'Painel',
    url: '/',
    icon: 'Home',
    category: null,
    order_index: 0
  });

  // 🏥 GESTÃO CLÍNICA
  if (permissions.canViewAllClients() || permissions.isProfessional() || customPermissions.hasPermission('view_clients')) {
    items.push({
      id: 'clients',
      title: 'Pacientes',
      url: '/clients',
      icon: 'Users',
      category: 'GESTÃO CLÍNICA',
      order_index: 1
    });
  }
  if (permissions.canViewMyPatients()) {
    items.push({
      id: 'my-patients',
      title: 'Meus Pacientes',
      url: '/my-patients',
      icon: 'Heart',
      category: 'GESTÃO CLÍNICA',
      order_index: 2
    });
  }
  if (permissions.isProfessional() || permissions.isCoordinator() || permissions.isDirector()) {
    items.push({
      id: 'medical-records',
      title: 'Prontuários',
      url: '/medical-records',
      icon: 'FileText',
      category: 'GESTÃO CLÍNICA',
      order_index: 3
    });
  }
  if (permissions.isDirector() || permissions.isCoordinator()) {
    items.push({
      id: 'attendance-validation',
      title: 'Validar Atendimentos',
      url: '/attendance-validation',
      icon: 'CheckSquare',
      category: 'GESTÃO CLÍNICA',
      order_index: 4
    });
  }
  items.push({
    id: 'feedback-control',
    title: 'Controle de Devolutiva',
    url: '/feedback-control',
    icon: 'FileCheck',
    category: 'GESTÃO CLÍNICA',
    order_index: 5
  });

  // Neuroavaliação - apenas diretores
  if (permissions.isDirector()) {
    items.push({
      id: 'neuroassessment',
      title: 'Neuroavaliação',
      url: '/neuroassessment',
      icon: 'Brain',
      category: 'GESTÃO CLÍNICA',
      order_index: 5.5
    });
  }

  // 📅 AGENDA
  if (permissions.canViewAllSchedules() || permissions.isProfessional() || customPermissions.hasPermission('view_schedules')) {
    items.push({
      id: 'schedule',
      title: 'Agenda',
      url: '/schedule',
      icon: 'Calendar',
      category: 'AGENDA',
      order_index: 6
    });
  }
  if (permissions.isDirector() || permissions.isCoordinator()) {
    items.push({
      id: 'schedule-control',
      title: 'Controle de Agendamentos',
      url: '/schedule-control',
      icon: 'ClipboardList',
      category: 'AGENDA',
      order_index: 7
    });
    items.push({
      id: 'meeting-alerts',
      title: 'Alertas de Reunião',
      url: '/meeting-alerts',
      icon: 'Bell',
      category: 'AGENDA',
      order_index: 8
    });
  }

  // 💰 FINANCEIRO - Apenas diretores
  if (permissions.isDirector() || customPermissions.hasPermission('view_financial')) {
    items.push({
      id: 'financial',
      title: 'Financeiro',
      url: '/financial',
      icon: 'DollarSign',
      category: 'FINANCEIRO',
      order_index: 9
    });
  }
  if (permissions.userRole === 'director' || permissions.userRole === 'coordinator_floresta' || customPermissions.hasPermission('view_contracts')) {
    items.push({
      id: 'contracts',
      title: 'Contratos - Floresta',
      url: '/contracts',
      icon: 'FolderOpen',
      category: 'FINANCEIRO',
      order_index: 10
    });
  }

  // Templates de Contrato - apenas diretores
  if (permissions.isDirector()) {
    items.push({
      id: 'contract-templates',
      title: 'Templates de Contrato',
      url: '/contract-templates',
      icon: 'FileText',
      category: 'FINANCEIRO',
      order_index: 10.5
    });
  }

  // 📦 ESTOQUE
  if (permissions.canManageStock() || customPermissions.hasPermission('view_stock')) {
    items.push({
      id: 'stock',
      title: 'Estoque',
      url: '/stock',
      icon: 'Package',
      category: 'ESTOQUE',
      order_index: 11
    });
  }

  // 👥 EQUIPE
  if (permissions.canManageEmployees() || customPermissions.hasPermission('view_employees')) {
    items.push({
      id: 'employees',
      title: 'Funcionários',
      url: '/employees-new',
      icon: 'UserPlus',
      category: 'EQUIPE',
      order_index: 12
    });
  }
  if (permissions.isDirector()) {
    items.push({
      id: 'employee-control',
      title: 'Controle de Funcionários',
      url: '/employee-control',
      icon: 'UserCheck',
      category: 'EQUIPE',
      order_index: 13
    });
    items.push({
      id: 'custom-roles',
      title: 'Cargos Personalizados',
      url: '/custom-roles',
      icon: 'Tag',
      category: 'EQUIPE',
      order_index: 13.5
    });
    items.push({
      id: 'anamnesis',
      title: 'Anamnese Digital',
      url: '/anamnesis',
      icon: 'ClipboardList',
      category: 'GESTÃO CLÍNICA',
      order_index: 5.6
    });
  }
  if (permissions.canManageUsers?.()) {
    items.push({
      id: 'users',
      title: 'Usuários',
      url: '/users',
      icon: 'Shield',
      category: 'EQUIPE',
      order_index: 14
    });
  }

  // 📊 RELATÓRIOS
  if (permissions.canViewReports() || customPermissions.hasPermission('view_reports')) {
    items.push({
      id: 'reports',
      title: 'Relatórios',
      url: '/reports',
      icon: 'BarChart3',
      category: 'RELATÓRIOS',
      order_index: 15
    });
  }

  // 💬 COMUNICAÇÃO
  items.push({
    id: 'messages',
    title: 'Mensagens',
    url: '/messages',
    icon: 'MessageSquare',
    category: 'COMUNICAÇÃO',
    order_index: 16
  });

  // 📁 PESSOAL
  items.push({
    id: 'my-files',
    title: 'Meus Arquivos',
    url: '/my-files',
    icon: 'Folder',
    category: 'PESSOAL',
    order_index: 17
  });
  items.push({
    id: 'timesheet',
    title: 'Ponto Eletrônico',
    url: '/timesheet',
    icon: 'Clock',
    category: 'PESSOAL',
    order_index: 18
  });
  return items.sort((a, b) => a.order_index - b.order_index);
};

interface MenuItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: string | null;
  order_index: number;
}

// Simple menu item component
const SidebarNavItem = memo(({ 
  item, 
  isActive, 
  collapsed 
}: { 
  item: MenuItem; 
  isActive: boolean; 
  collapsed: boolean;
}) => {
  const IconComponent = iconMapping[item.icon];
  
  const content = (
    <NavLink 
      to={item.url} 
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
        isActive 
          ? "bg-primary text-primary-foreground font-medium" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      {IconComponent && <IconComponent className="h-4 w-4 shrink-0" />}
      {!collapsed && <span className="truncate">{item.title}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{content}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
});

SidebarNavItem.displayName = 'SidebarNavItem';

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const permissions = useRolePermissions();
  const customPermissions = useCustomPermissions();
  const currentPath = location.pathname;
  const [navigationItems, setNavigationItems] = useState<MenuItem[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Load navigation items based on permissions
  useEffect(() => {
    if (!permissions.loading && !customPermissions.loading) {
      const items = getMenuItemsForRole(permissions, customPermissions);
      setNavigationItems(items);
    }
  }, [permissions.loading, permissions.userRole, customPermissions.loading, customPermissions.permissions]);

  // Auto-expand category containing active route
  useEffect(() => {
    const activeItem = navigationItems.find(item => {
      if (item.url === '/') return currentPath === '/';
      return currentPath.startsWith(item.url);
    });
    if (activeItem?.category) {
      setOpenCategories(prev => ({ ...prev, [activeItem.category!]: true }));
    }
  }, [currentPath, navigationItems]);

  // Close sidebar on mobile after navigation
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [currentPath, isMobile, setOpenMobile]);

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  }, []);

  const isActive = useCallback((path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  }, [currentPath]);

  // Group items by category - memoized
  const groupedItems = useMemo(() => {
    return navigationItems.reduce((acc, item) => {
      const category = item.category || 'main';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [navigationItems]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao fazer logout."
      });
    }
  };

  const categories = ['GESTÃO CLÍNICA', 'AGENDA', 'FINANCEIRO', 'ESTOQUE', 'EQUIPE', 'RELATÓRIOS', 'COMUNICAÇÃO', 'PESSOAL'];

  return (
    <Sidebar className={cn(
      "border-r border-border",
      collapsed ? "w-16" : "w-64"
    )}>
      <SidebarContent className="flex flex-col h-full bg-sidebar-background">
        {/* Clean Logo Header */}
        <div className={cn(
          "flex items-center border-b border-border",
          collapsed ? "p-3 justify-center" : "px-4 py-4 gap-3"
        )}>
          <img 
            src="/lovable-uploads/1e0ba652-7476-47a6-b6a0-0f2c90e306bd.png" 
            alt="Fundação Dom Bosco" 
            className={cn("object-contain", collapsed ? "h-8 w-8" : "h-10")}
            loading="lazy"
          />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">Sistema Clínico</span>
              <span className="text-xs text-muted-foreground truncate">Fundação Dom Bosco</span>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-2 py-2">
          {/* Dashboard Item */}
          {groupedItems.main && (
            <div className="mb-2">
              <SidebarMenu>
                {groupedItems.main.map(item => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <SidebarNavItem 
                        item={item} 
                        isActive={isActive(item.url)} 
                        collapsed={collapsed}
                      />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          )}

          {/* Simple separator */}
          {!collapsed && <div className="h-px bg-border mx-2 mb-2" />}

          {/* Categorized Menu Groups */}
          <div className="space-y-1">
            {categories.map(category => {
              if (!groupedItems[category] || groupedItems[category].length === 0) return null;
              
              const isOpen = openCategories[category] ?? false;
              const hasActiveItem = groupedItems[category].some(item => isActive(item.url));

              if (collapsed) {
                return (
                  <div key={category} className="space-y-0.5">
                    {groupedItems[category].map(item => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild>
                          <SidebarNavItem 
                            item={item} 
                            isActive={isActive(item.url)} 
                            collapsed={collapsed}
                          />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </div>
                );
              }

              return (
                <Collapsible 
                  key={category} 
                  open={isOpen} 
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide",
                    hasActiveItem 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                    <ChevronRight className={cn(
                      "h-3 w-3 transition-transform duration-75",
                      isOpen && "rotate-90"
                    )} />
                    <span>{category}</span>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                    <SidebarMenu className="pl-2 mt-0.5 space-y-0.5">
                      {groupedItems[category].map(item => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton asChild>
                            <SidebarNavItem 
                              item={item} 
                              isActive={isActive(item.url)} 
                              collapsed={collapsed}
                            />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Clean Footer */}
        <div className="mt-auto border-t border-border p-2 space-y-1">
          <UserAvatarFooter collapsed={collapsed} />
          
          <SidebarMenu>
            <SidebarMenuItem>
              <ThemeToggle collapsed={collapsed} />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button 
                  onClick={handleLogout} 
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm",
                    "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sair</span>}
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

// Simple user avatar footer
const UserAvatarFooter = memo(({ collapsed }: { collapsed: boolean }) => {
  const { userName, userRole, avatarUrl } = useCurrentUser();
  
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex justify-center py-1">
            <UserAvatar 
              name={userName}
              avatarUrl={avatarUrl}
              role={userRole}
              size="sm"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{userName || 'Usuário'}</p>
          <p className="text-xs text-muted-foreground">{userRole}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
      <UserAvatar 
        name={userName}
        avatarUrl={avatarUrl}
        role={userRole}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{userName || 'Usuário'}</p>
        <p className="text-xs text-muted-foreground truncate">{userRole || 'Carregando...'}</p>
      </div>
    </div>
  );
});

UserAvatarFooter.displayName = 'UserAvatarFooter';
