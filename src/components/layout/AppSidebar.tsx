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
};

interface DatabaseMenuItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  order_index: number;
  role_required?: string;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const [userRole, setUserRole] = useState<string | null>(null);
  const [navigationItems, setNavigationItems] = useState<DatabaseMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error('Error loading user role:', error);
      }
    };

    loadUserRole();
  }, [user]);

  // Load menu items from database with cache clear
  const loadMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      const cacheKey = `menu_items_${Date.now()}`; // Force cache refresh
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      
      if (error) throw error;
      setNavigationItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
      // Fallback to empty array if database fails
      setNavigationItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenuItems();
    // Auto-refresh menu every 30 seconds to clear cache
    const interval = setInterval(loadMenuItems, 30000);
    return () => clearInterval(interval);
  }, [loadMenuItems]);

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";

  const shouldShowMenuItem = (item: DatabaseMenuItem) => {
    if (!item.role_required) return true;
    return userRole === item.role_required;
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
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando menu...
                </div>
              ) : (
                navigationItems.filter(shouldShowMenuItem).map((item) => {
                  const IconComponent = iconMapping[item.icon];
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          end 
                          className={({ isActive }) => getNavCls({ isActive })}
                        >
                          {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
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