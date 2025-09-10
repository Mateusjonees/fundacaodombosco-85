import { useState, useEffect } from 'react';
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
  Home,
  FolderOpen,
  LogOut
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

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Cadastrar Cliente', url: '/client-form', icon: UserPlus },
  { title: 'Lista de Clientes', url: '/clients', icon: Users },
  { title: 'Agenda do Dia', url: '/schedule', icon: Calendar },
  { title: 'Meus Pacientes', url: '/my-patients', icon: UserCheck },
  { title: 'Meus Arquivos', url: '/my-files', icon: FolderOpen },
  { title: 'Financeiro', url: '/financial', icon: DollarSign },
  { title: 'Relatórios', url: '/reports', icon: BarChart3 },
  { title: 'Estoque', url: '/stock', icon: Package },
  { title: 'Funcionários', url: '/employees', icon: Users },
  { title: 'Gerenciar Usuários', url: '/user-management', icon: UserPlus, roleRequired: 'director' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const [userRole, setUserRole] = useState<string | null>(null);

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
      } catch (error) {
        console.error('Error loading user role:', error);
      }
    };

    loadUserRole();
  }, [user]);

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";

  const shouldShowMenuItem = (item: any) => {
    if (!item.roleRequired) return true;
    return userRole === item.roleRequired;
  };

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
          <div className={collapsed ? "p-2" : "p-4 border-b"}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-sm">
                FDB
              </div>
              {!collapsed && (
                <div>
                  <div className="font-bold text-sm text-foreground">FUNDAÇÃO</div>
                  <div className="font-bold text-xs text-foreground">DOM BOSCO</div>
                </div>
              )}
            </div>
          </div>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            MENU PRINCIPAL
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(shouldShowMenuItem).map((item) => (
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