import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useNeuroStats } from '@/hooks/useNeuroStats';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, Calendar, DollarSign, UserPlus, Package, BarChart3, UserCheck, Home, FolderOpen, LogOut, Settings, Archive, CheckSquare, Shield, Heart, ClipboardList, MessageSquare, FileCheck, FileText, Folder, Clock, Bell, Brain, LucideIcon, ChevronRight, Moon, Sun, MoreHorizontal, ChevronsUpDown } from 'lucide-react';
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

// Category accent colors for visual distinction
const categoryAccents: Record<string, { icon: string; activeBg: string; activeText: string; dot: string }> = {
  'GESTÃO CLÍNICA': {
    icon: 'text-emerald-500 dark:text-emerald-400',
    activeBg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    activeText: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  'AGENDA': {
    icon: 'text-blue-500 dark:text-blue-400',
    activeBg: 'bg-blue-500/10 dark:bg-blue-400/10',
    activeText: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  'FINANCEIRO': {
    icon: 'text-amber-500 dark:text-amber-400',
    activeBg: 'bg-amber-500/10 dark:bg-amber-400/10',
    activeText: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  'ESTOQUE': {
    icon: 'text-purple-500 dark:text-purple-400',
    activeBg: 'bg-purple-500/10 dark:bg-purple-400/10',
    activeText: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  'EQUIPE': {
    icon: 'text-cyan-500 dark:text-cyan-400',
    activeBg: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    activeText: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  'RELATÓRIOS': {
    icon: 'text-rose-500 dark:text-rose-400',
    activeBg: 'bg-rose-500/10 dark:bg-rose-400/10',
    activeText: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  'COMUNICAÇÃO': {
    icon: 'text-indigo-500 dark:text-indigo-400',
    activeBg: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    activeText: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  'PESSOAL': {
    icon: 'text-slate-500 dark:text-slate-400',
    activeBg: 'bg-slate-500/10 dark:bg-slate-400/10',
    activeText: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-500',
  },
};

// Dynamic menu items based on role permissions
const getMenuItemsForRole = (permissions: any, customPermissions: any) => {
  const items = [];

  items.push({ id: 'dashboard', title: 'Painel', url: '/', icon: 'Home', category: null, order_index: 0 });

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

  if (permissions.canViewAllSchedules() || permissions.isProfessional() || customPermissions.hasPermission('view_schedules')) {
    items.push({ id: 'schedule', title: 'Agenda', url: '/schedule', icon: 'Calendar', category: 'AGENDA', order_index: 6 });
  }
  if (permissions.isDirector() || permissions.isCoordinator() || permissions.hasRole('receptionist')) {
    items.push({ id: 'schedule-control', title: 'Controle de Agendamentos', url: '/schedule-control', icon: 'ClipboardList', category: 'AGENDA', order_index: 7 });
  }
  items.push({ id: 'meeting-alerts', title: 'Alertas de Reunião', url: '/meeting-alerts', icon: 'Bell', category: 'AGENDA', order_index: 8 });

  if (permissions.isDirector() || customPermissions.hasPermission('view_financial')) {
    items.push({ id: 'financial', title: 'Financeiro', url: '/financial', icon: 'DollarSign', category: 'FINANCEIRO', order_index: 9 });
  }
  if (permissions.userRole === 'director' || permissions.userRole === 'coordinator_floresta' || customPermissions.hasPermission('view_contracts')) {
    items.push({ id: 'contracts', title: 'Contratos', url: '/contracts', icon: 'FolderOpen', category: 'FINANCEIRO', order_index: 10 });
  }

  if (permissions.canManageStock() || customPermissions.hasPermission('view_stock')) {
    items.push({ id: 'stock', title: 'Estoque', url: '/stock', icon: 'Package', category: 'ESTOQUE', order_index: 11 });
  }

  if (permissions.canManageEmployees() || permissions.canManageUsers?.() || customPermissions.hasPermission('view_employees')) {
    items.push({ id: 'users', title: 'Gestão de Equipe', url: '/users', icon: 'Users', category: 'EQUIPE', order_index: 12 });
  }
  if (permissions.isDirector() || permissions.isCoordinator()) {
    items.push({ id: 'employee-control', title: 'Controle de Funcionários', url: '/employee-control', icon: 'UserCheck', category: 'EQUIPE', order_index: 13 });
  }

  if (permissions.canViewReports() || customPermissions.hasPermission('view_reports')) {
    items.push({ id: 'reports', title: 'Relatórios', url: '/reports', icon: 'BarChart3', category: 'RELATÓRIOS', order_index: 15 });
  }

  items.push({ id: 'messages', title: 'Mensagens', url: '/messages', icon: 'MessageSquare', category: 'COMUNICAÇÃO', order_index: 16 });

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

// Nav item with category-colored active state
const SidebarNavItem = memo(({
  item,
  isActive,
  collapsed,
  accent,
  badgeCount,
}: {
  item: MenuItem;
  isActive: boolean;
  collapsed: boolean;
  accent?: typeof categoryAccents[string];
  badgeCount?: number;
}) => {
  const IconComponent = iconMapping[item.icon];
  const isDashboard = item.category === null;

  const content = (
    <NavLink
      to={item.url}
      className={cn(
        "group relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all duration-150",
        isActive
          ? cn(
              "font-medium",
              isDashboard
                ? "bg-primary/10 text-primary dark:bg-primary/15"
                : accent?.activeBg + " " + accent?.activeText
            )
          : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
        collapsed && "justify-center px-2 py-2.5 mx-auto"
      )}
    >
      {IconComponent && (
        <div className={cn(
          "flex items-center justify-center shrink-0 transition-colors duration-150",
          collapsed ? "h-5 w-5" : "h-4 w-4"
        )}>
          <IconComponent className={cn(
            "h-full w-full",
            isActive
              ? isDashboard
                ? "text-primary"
                : accent?.icon
              : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/65"
          )} strokeWidth={isActive ? 2 : 1.7} />
        </div>
      )}
      {!collapsed && <span className="truncate leading-none">{item.title}</span>}
      {!collapsed && badgeCount && badgeCount > 0 && (
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
          {badgeCount}
        </span>
      )}
      {collapsed && badgeCount && badgeCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-destructive animate-pulse" />
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{content}</div>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="text-xs font-medium shadow-lg">
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
  const isNeuroCoordinator = ['coordinator_floresta', 'coordinator_atendimento_floresta'].includes(permissions.userRole || '');
  const { data: neuroStats } = useNeuroStats(isNeuroCoordinator);

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
      "border-r border-sidebar-border/50",
      collapsed ? "w-[60px]" : "w-[256px]"
    )}>
      <SidebarContent className="flex flex-col h-full bg-sidebar">
        {/* Header — workspace style */}
        <div className={cn(
          "shrink-0",
          collapsed ? "px-2 py-3" : "px-3 py-3"
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-1">
              <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                <img
                  alt="FDB"
                  src="/lovable-uploads/12d10c14-c39b-4936-8278-6b4465ada7b2.jpg"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-semibold text-sidebar-foreground leading-tight truncate">
                  Dom Bosco
                </span>
                <span className="text-[11px] text-sidebar-foreground/45 leading-tight truncate">
                  Clínica Multidisciplinar
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-7 w-7 rounded-lg overflow-hidden shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
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

        <div className={cn("mx-2", collapsed && "mx-1.5")}>
          <div className="h-px bg-sidebar-border/50" />
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className={cn("py-2", collapsed ? "px-1.5" : "px-2")}>
            {/* Dashboard */}
            {groupedItems.main && (
              <div className="mb-2">
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

            {/* Category groups */}
            <div className={cn("space-y-4", collapsed && "space-y-2")}>
              {categories.map(category => {
                if (!groupedItems[category] || groupedItems[category].length === 0) return null;
                const accent = categoryAccents[category];

                if (collapsed) {
                  return (
                    <div key={category}>
                      <div className="flex justify-center py-0.5 mb-0.5">
                        <div className={cn("h-1 w-1 rounded-full", accent?.dot || "bg-sidebar-border")} />
                      </div>
                      <SidebarMenu>
                        {groupedItems[category].map(item => (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton asChild>
                              <SidebarNavItem item={item} isActive={isActive(item.url)} collapsed={collapsed} accent={accent} badgeCount={item.id === 'neuroassessment' ? neuroStats?.overdueReports : undefined} />
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </div>
                  );
                }

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 px-3 pt-1 pb-1.5">
                      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", accent?.dot || "bg-muted-foreground")} />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/40 select-none">
                        {category}
                      </span>
                    </div>
                    <SidebarMenu>
                      {groupedItems[category].map(item => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton asChild>
                            <SidebarNavItem item={item} isActive={isActive(item.url)} collapsed={collapsed} accent={accent} badgeCount={item.id === 'neuroassessment' ? neuroStats?.overdueReports : undefined} />
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

        {/* Footer */}
        <div className={cn("mx-2 mb-1", collapsed && "mx-1.5")}>
          <div className="h-px bg-sidebar-border/50" />
        </div>
        <div className="shrink-0 p-2 pt-1">
          <UserAvatarFooter collapsed={collapsed} onLogout={handleLogout} />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

// User footer
const UserAvatarFooter = memo(({ collapsed, onLogout }: { collapsed: boolean; onLogout: () => void }) => {
  const { userName, userRole, avatarUrl } = useCurrentUser();
  const { theme, setTheme } = useTheme();

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex justify-center w-full py-1 rounded-lg hover:bg-sidebar-accent/60 transition-colors">
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
        <button className="flex items-center gap-2.5 px-2 py-2 rounded-lg w-full text-left cursor-pointer hover:bg-sidebar-accent/60 transition-colors duration-150 group">
          <div className="shrink-0 ring-2 ring-sidebar-border/50 rounded-full">
            <UserAvatar name={userName} avatarUrl={avatarUrl} role={userRole} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate text-sidebar-foreground leading-tight">{userName || 'Usuário'}</p>
            <p className="text-[10px] text-sidebar-foreground/40 truncate leading-tight mt-0.5">{userRole || 'Carregando...'}</p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/25 group-hover:text-sidebar-foreground/50 shrink-0 transition-colors" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="min-w-[220px]">
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
});
UserAvatarFooter.displayName = 'UserAvatarFooter';
