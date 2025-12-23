import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '@/assets/fundacao-dom-bosco-logo-optimized.png';
import { 
  Users, Calendar, DollarSign, UserPlus, Package, BarChart3, UserCheck, 
  Home, FolderOpen, LogOut, Settings, Archive, CheckSquare, Shield, Heart, 
  ClipboardList, MessageSquare, FileCheck, FileText, Folder, Clock, Bell, Brain, 
  LucideIcon, ChevronDown, ChevronRight, Stethoscope, CalendarDays, Wallet, 
  UsersRound, TrendingUp, MessageCircle, User, Tag
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

// Map icon names to actual icon components
const iconMapping: Record<string, LucideIcon> = {
  Home, UserPlus, Users, Calendar, ClipboardList, UserCheck, FolderOpen, 
  DollarSign, BarChart3, Package, Settings, Archive, CheckSquare, Shield, 
  Heart, MessageSquare, FileCheck, FileText, Folder, Clock, Bell, Brain, Tag
};

// Category icons and colors
const categoryConfig: Record<string, { icon: LucideIcon; color: string }> = {
  'GESTÃO CLÍNICA': { icon: Stethoscope, color: 'text-emerald-500' },
  'AGENDA': { icon: CalendarDays, color: 'text-blue-500' },
  'FINANCEIRO': { icon: Wallet, color: 'text-amber-500' },
  'ESTOQUE': { icon: Package, color: 'text-purple-500' },
  'EQUIPE': { icon: UsersRound, color: 'text-cyan-500' },
  'RELATÓRIOS': { icon: TrendingUp, color: 'text-rose-500' },
  'COMUNICAÇÃO': { icon: MessageCircle, color: 'text-indigo-500' },
  'PESSOAL': { icon: User, color: 'text-teal-500' },
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

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  // Group items by category
  const groupedItems = navigationItems.reduce((acc, item) => {
    const category = item.category || 'main';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

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
      "border-r border-border/50 bg-gradient-to-b from-background to-muted/20",
      collapsed ? "w-14" : "w-64"
    )}>
      <SidebarContent className="flex flex-col h-full">
        {/* Logo Header */}
        <div className={cn(
          "flex items-center justify-center border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent",
          collapsed ? "p-2" : "p-4"
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <img 
                alt="Fundação Dom Bosco" 
                src="/lovable-uploads/1e0ba652-7476-47a6-b6a0-0f2c90e306bd.png" 
                className="h-12 w-auto object-contain" 
              />
            </div>
          ) : (
            <img 
              src={logo} 
              alt="FDB" 
              className="h-8 w-8 object-contain" 
            />
          )}
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          {/* Dashboard - Main */}
          {groupedItems.main && (
            <div className="mb-2">
              <SidebarMenu>
                {groupedItems.main.map(item => {
                  const IconComponent = iconMapping[item.icon];
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                            active 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {IconComponent && <IconComponent className="h-4 w-4 shrink-0" />}
                          {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          )}

          {/* Categorized Menu Groups */}
          <div className="space-y-1">
            {categories.map(category => {
              if (!groupedItems[category] || groupedItems[category].length === 0) return null;
              
              const config = categoryConfig[category];
              const CategoryIcon = config?.icon;
              const isOpen = openCategories[category] ?? false;
              const hasActiveItem = groupedItems[category].some(item => isActive(item.url));

              if (collapsed) {
                // Collapsed: show only icons
                return (
                  <div key={category} className="space-y-0.5">
                    {groupedItems[category].map(item => {
                      const IconComponent = iconMapping[item.icon];
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton asChild>
                            <NavLink 
                              to={item.url}
                              title={item.title}
                              className={cn(
                                "flex items-center justify-center p-2 rounded-lg transition-all duration-200",
                                active 
                                  ? "bg-primary text-primary-foreground" 
                                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {IconComponent && <IconComponent className="h-4 w-4" />}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
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
                    "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all duration-200",
                    hasActiveItem 
                      ? "text-foreground bg-muted/50" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}>
                    {CategoryIcon && <CategoryIcon className={cn("h-3.5 w-3.5", config?.color)} />}
                    <span className="flex-1 text-left">{category}</span>
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 transition-transform" />
                    )}
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="pl-2 mt-1 space-y-0.5">
                    <SidebarMenu>
                      {groupedItems[category].map(item => {
                        const IconComponent = iconMapping[item.icon];
                        const active = isActive(item.url);
                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton asChild>
                              <NavLink 
                                to={item.url} 
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                                  active 
                                    ? "bg-primary text-primary-foreground shadow-sm font-medium" 
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {IconComponent && <IconComponent className="h-4 w-4 shrink-0" />}
                                <span className="truncate">{item.title}</span>
                                {active && (
                                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Footer Section */}
        <div className="mt-auto border-t border-border/50 p-2 space-y-1 bg-gradient-to-t from-muted/30 to-transparent">
          <SidebarMenu>
            <SidebarMenuItem>
              <ThemeToggle collapsed={collapsed} />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button 
                  onClick={handleLogout} 
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground",
                    "hover:bg-destructive/10 hover:text-destructive"
                  )}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-sm">Sair</span>}
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
