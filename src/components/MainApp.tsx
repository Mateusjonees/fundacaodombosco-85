import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useAuditLog } from '@/hooks/useAuditLog';
import { EmployeeManager } from '@/components/EmployeeManager';
import { LogOut, Users, Calendar, FileText, DollarSign, UserPlus, Shield, Package, Menu, Bell, ChevronDown } from 'lucide-react';
import { ROLE_LABELS } from '@/hooks/useRolePermissions';

// Import page components
import Clients from '@/pages/Clients';
import Schedule from '@/pages/Schedule';
import ScheduleControl from '@/pages/ScheduleControl';
import Financial from '@/pages/Financial';
import Contracts from '@/pages/Contracts';
import UserManagement from '@/pages/UserManagement';
import StockManager from '@/pages/StockManager';
import Reports from '@/pages/Reports';
import Dashboard from '@/pages/Dashboard';
import MyPatients from '@/pages/MyPatients';
import AttendanceValidation from '@/pages/AttendanceValidation';
import EmployeesNew from '@/pages/EmployeesNew';
import PendingAttendancesNotification from '@/components/PendingAttendancesNotification';
import AppointmentNotifications from '@/components/AppointmentNotifications';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  employee_role: string;
  phone?: string;
  document_cpf?: string;
  is_active: boolean;
  hire_date: string;
  department?: string;
}


export const MainApp = () => {
  const permissions = useRolePermissions();
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setCurrentUserProfile(data);
    } catch (error) {
      console.error('Unexpected error loading profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logAction({
        entityType: 'auth',
        action: 'logout_attempted',
        metadata: { user_email: user?.email }
      });

      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao sair",
          description: error.message,
        });
      } else {
        await logAction({
          entityType: 'auth',
          action: 'logout_success',
          metadata: { user_email: user?.email }
        });
        
        toast({
          title: "Logout realizado com sucesso",
          description: "Até logo!",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
      });
    }
  };

  return (
    <Router>
      <SidebarProvider>
        <div className="min-h-screen w-full flex">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            {/* Header with hamburger menu */}
            <header className="bg-white/80 backdrop-blur-md border-b border-border/50 px-4 sm:px-6 py-3 sticky top-0 z-40 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="flex items-center justify-center h-9 w-9 rounded-lg border hover:bg-accent transition-colors">
                    <Menu className="h-4 w-4" />
                  </SidebarTrigger>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <AppointmentNotifications />
                    <PendingAttendancesNotification />
                  </div>
                  
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {currentUserProfile?.name || user?.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentUserProfile?.employee_role ? ROLE_LABELS[currentUserProfile.employee_role] : 'Carregando...'}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="gap-2 text-muted-foreground hover:text-foreground h-9"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden lg:inline">Sair</span>
                  </Button>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/schedule-control" element={<ScheduleControl />} />
                <Route path="/attendance-validation" element={<AttendanceValidation />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/stock" element={<StockManager />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/my-patients" element={<MyPatients />} />
                <Route path="/employees-new" element={<EmployeesNew />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </Router>
  );
};