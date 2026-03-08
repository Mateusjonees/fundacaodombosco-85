import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, Calendar, DollarSign, UserPlus, Package, BarChart3, UserCheck, Home, FolderOpen, LogOut, Settings, Archive, CheckSquare, Shield, Heart, ClipboardList, MessageSquare, FileCheck, FileText, Folder, Clock, Bell, Brain, LucideIcon, ChevronRight, Moon, Sun, MoreHorizontal } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useCustomPermissions } from '@/hooks/useCustomPermissions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';

const iconMapping: Record<string, LucideIcon> = {
  Home, UserPlus, Users, Calendar, ClipboardList, UserCheck, FolderOpen,
  DollarSign, BarChart3, Package, Settings, Archive, CheckSquare, Shield,
  Heart, MessageSquare, FileCheck, FileText, Folder, Clock, Bell, Brain,
};

// Dynamic menu items based on role permissions
const getMenuItemsForRole = (permissions: any, customPermissions: any) => {
  const items = [];

  items.push({ id: 'dashboard', title: 'Painel', url: '/', icon: 'Home', category: null, order_index: 0 });

  // GESTÃO CLÍNICA
  if (permissions.canViewAllClients() || permissions.isProfessional() || customPermissions.hasPermission('view_clients')) {
    items.push({ id: 'clients', title: 'Pacientes', url: '/clients', icon: 'Users', category: 'GESTÃO CLÍNICA', order_index: 1 });
  }
  if (permissions.canViewMyPatients()) {
    items.push({ id: 'my-patients', title: 'Meus Pacientes', url: '/my-patients', icon: 'Heart', category: 'GESTÃO CLÍNICA', order_index: 2 });
  }
  if (permissions.isProfessional() || permissions.isCoordinator() || permissions.isDirector()) {
    items.push({ id: 'medical-records', title: 'Prontuários', url: '/medical-records', icon: 'FileText', category: 'GESTÃO CLÍNICA', order_index: 3 });
  }
  if (permissions.isDirector() || permissions.isCoordinator() || permissions.hasAnyRole(['receptionist'])) {
    items.push({ id: 'attendance-validation', title: 'Validar Atendimentos', url: '/attendance-validation', icon: 'CheckSquare', category: 'GESTÃO CLÍNICA', order_index: 4 });
  }
  if (permissions.isDirector() || permissions.isCoordinator()) {
    items.push({ id: 'feedback-control', title: 'Controle de Devolutiva', url: '/feedback-control', icon: 'FileCheck', category: 'GESTÃO CLÍNICA', order_index: 5 });
  }
  if (permissions.isProfessional() || permissions.isCoordinator() || permissions.isDirector()) {
    items.push({ id: 'anamnesis', title: 'Anamnese', url: '/anamnesis', icon: 'ClipboardList', category: 'GESTÃO CLÍNICA', order_index: 5.5 });
  }
  if (permissions.isDirector() || permissions.isCoordinator() || permissions.hasAnyRole(['psychologist', 'psychopedagogue'])) {
    items.push({ id: 'neuroassessment', title: 'Neuroavaliação', url: '/neuroassessment', icon: 'Brain', category: 'GESTÃO CLÍNICA', order_index: 5.6 });
  }
  if (permissions.isDirector() || permissions.isCoordinator() || permissions.hasAnyRole(['receptionist'])) {
    items.push({ id: 'waiting-list', title: 'Fila de Espera', url: '/waiting-list', icon: 'Archive', category: 'GESTÃO CLÍNICA', order_index: 5.7 });
  }

  // AGENDA
  if (permissions.canViewAllSchedules() || permissions.isProfessional() || customPermissions.hasPermission('view_schedules')) {
    items.push({ id: 'schedule', title: 'Agenda', url: '/schedule', icon: 'Calendar', category: 'AGENDA', order_index: 6 });
  }
  if (permissions.isDirector() || permissions.isCoordinator()) {
    items.push({ id: 'schedule-control', title: 'Controle de Agendamentos', url: '/schedule-control', icon: 'ClipboardList', category: 'AGENDA', order_index: 7 });
  }
  items.push({ id: 'meeting-alerts', title: 'Alertas de Reunião', url: '/meeting-alerts', icon: 'Bell', category: 'AGENDA', order_index: 8 });

  // FINANCEIRO
  if (permissions.isDirector() || customPermissions.hasPermission('view_financial')) {
    items.push({ id: 'financial', title: 'Financeiro', url: '/financial', icon: 'DollarSign', category: 'FINANCEIRO', order_index: 9 });
  }
  if (permissions.userRole === 'director' || permissions.userRole === 'coordinator_floresta' || customPermissions.hasPermission('view_contracts')) {
    items.push({ id: 'contracts', title: 'Contratos', url: '/contracts', icon: 'FolderOpen', category: 'FINANCEIRO', order_index: 10 });
  }

  // ESTOQUE
  if (permissions.canManageStock() || customPermissions.hasPermission('view_stock')) {
    items.push({ id: 'stock', title: 'Estoque', url: '/stock', icon: 'Package', category: 'ESTOQUE', order_index: 11 });
  }

  // EQUIPE
  if (permissions.canManageEmployees() || permissions.canManageUsers?.() || customPermissions.hasPermission('view_employees')) {
    items.push({ id: 'users', title: 'Gestão de Equipe', url: '/users', icon: 'Users', category: 'EQUIPE', order_index: 12 });
  }
  if (permissions.isDirector() || permissions.isCoordinator()) {
    items.push({ id: 'employee-control', title: 'Controle de Funcionários', url: '/employee-control', icon: 'UserCheck', category: 'EQUIPE', order_index: 13 });
  }

  // RELATÓRIOS
  if (permissions.canViewReports() || customPermissions.hasPermission('view_reports')) {
    items.push({ id: 'reports', title: 'Relatórios', url: '/reports', icon: 'BarChart3', category: 'RELATÓRIOS', order_index: 15 });
  }

  // COMUNICAÇÃO
  items.push({ id: 'messages', title: 'Mensagens', url: '/messages', icon: 'MessageSquare', category: 'COMUNICAÇÃO', order_index: 16 });

  // PESSOAL
  items.push({ id: 'my-files', title: 'Meus Arquivos', url: '/my-files', icon: 'Folder', category: 'PESSOAL', order_index: 17 });
  items.push({ id: 'timesheet', title: 'Ponto Eletrônico', url: '/timesheet', icon: 'Clock', category: 'PESSOAL', order_index: 18 });

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

// Premium nav item with refined active indicator
const SidebarNavItem = memo(({
  item,
  isActive,
  collapsed,
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
        "group relative flex items-center gap-3 px-3 py-[7px] rounded-md text-[13px] font-normal transition-all duration-200",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
        collapsed && "justify-center px-0 py-2"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-sidebar-primary" />
      )}
      {IconComponent && (
        <IconComponent className={cn(
          "h-[16px] w-[16px] shrink-0 transition-colors duration-200",
          isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
        )} strokeWidth={isActive ? 2.2 : 1.8} />
      )}
      {!collapsed && <span className="truncate">{item.title}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{content}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
});
SidebarNavItem.displayName = 'SidebarNavItem';

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = isMobile ? false : state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const permissions = useRolePermissions();
  const customPermissions = useCustomPermissions();
  const currentPath = location.pathname;
  const [navigationItems, setNavigationItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (!permissions.loading && !customPermissions.loading) {
      const items = getMenuItemsForRole(permissions, customPermissions);
      setNavigationItems(items);
    }
  }, [permissions.loading, permissions.userRole, customPermissions.loading, customPermissions.permissions]);

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [currentPath, isMobile, setOpenMobile]);

  const isActive = useCallback((path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  }, [currentPath]);

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
      toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso." });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao fazer logout." });
    }
  };

  const categories = ['GESTÃO CLÍNICA', 'AGENDA', 'FINANCEIRO', 'ESTOQUE', 'EQUIPE', 'RELATÓRIOS', 'COMUNICAÇÃO', 'PESSOAL'];

  return (
    <Sidebar collapsible="icon" className={cn(
      "border-r border-sidebar-border/60",
      collapsed ? "w-[60px]" : "w-[252px]"
    )}>
      <SidebarContent className="flex flex-col h-full bg-sidebar">
        {/* Header — minimal branding */}
        <div className={cn(
          "shrink-0 border-b border-sidebar-border/40",
          collapsed ? "px-2 py-3" : "px-4 py-3.5"
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 bg-sidebar-accent flex items-center justify-center">
                <img
                  alt="FDB"
                  src="/lovable-uploads/12d10c14-c39b-4936-8278-6b4465ada7b2.jpg"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-sidebar-foreground leading-tight truncate">
                  Dom Bosco
                </span>
                <span className="text-[11px] text-sidebar-foreground/50 leading-tight truncate">
                  Clínica Multidisciplinar
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-7 w-7 rounded-lg overflow-hidden bg-sidebar-accent">
                <img
                  alt="FDB"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  src="/lovable-uploads/12d10c14-c39b-4936-8278-6b4465ada7b2.jpg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className={cn("py-2", collapsed ? "px-1.5" : "px-2")}>
            {/* Dashboard — standalone */}
            {groupedItems.main && (
              <div className="mb-1">
                <SidebarMenu>
                  {groupedItems.main.map(item => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <SidebarNavItem item={item} isActive={isActive(item.url)} collapsed={collapsed} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            )}

            {/* Categories */}
            <div className={cn("space-y-3", collapsed && "space-y-2")}>
              {categories.map(category => {
                if (!groupedItems[category] || groupedItems[category].length === 0) return null;

                if (collapsed) {
                  return (
                    <div key={category}>
                      <div className="flex justify-center py-1">
                        <div className="h-px w-4 bg-sidebar-border/60" />
                      </div>
                      <SidebarMenu>
                        {groupedItems[category].map(item => (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton asChild>
                              <SidebarNavItem item={item} isActive={isActive(item.url)} collapsed={collapsed} />
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </div>
                  );
                }

                return (
                  <div key={category}>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/35 select-none">
                      {category}
                    </p>
                    <SidebarMenu>
                      {groupedItems[category].map(item => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton asChild>
                            <SidebarNavItem item={item} isActive={isActive(item.url)} collapsed={collapsed} />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Footer — user account */}
        <div className="shrink-0 border-t border-sidebar-border/40 p-2">
          <UserAvatarFooter collapsed={collapsed} onLogout={handleLogout} />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

// Clean user footer with theme toggle
const UserAvatarFooter = memo(({ collapsed, onLogout }: { collapsed: boolean; onLogout: () => void }) => {
  const { userName, userRole, avatarUrl } = useCurrentUser();
  const { theme, setTheme } = useTheme();

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex justify-center w-full py-1 rounded-md hover:bg-sidebar-accent/50 transition-colors">
            <UserAvatar name={userName} avatarUrl={avatarUrl} role={userRole} size="sm" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="min-w-[200px]">
          <div className="px-3 py-2">
            <p className="font-medium text-sm truncate">{userName || 'Usuário'}</p>
            <p className="text-[11px] text-muted-foreground truncate">{userRole}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="cursor-pointer gap-2">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive cursor-pointer gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 px-2.5 py-2 rounded-md w-full text-left cursor-pointer hover:bg-sidebar-accent/50 transition-colors duration-150">
          <UserAvatar name={userName} avatarUrl={avatarUrl} role={userRole} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate text-sidebar-foreground">{userName || 'Usuário'}</p>
            <p className="text-[10px] text-sidebar-foreground/45 truncate">{userRole || 'Carregando...'}</p>
          </div>
          <MoreHorizontal className="h-4 w-4 text-sidebar-foreground/30 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="min-w-[200px]">
        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="cursor-pointer gap-2">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive cursor-pointer gap-2">
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
UserAvatarFooter.displayName = 'UserAvatarFooter';
