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
import { LogOut, Users, Calendar, FileText, DollarSign, UserPlus, Shield, Package, Menu } from 'lucide-react';
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
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col w-full">
            {/* Mobile-optimized Header */}
            <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-40">
              <div className="flex items-center justify-between px-3 md:px-6 py-3">
                <div className="flex items-center gap-2 md:gap-4">
                  <SidebarTrigger className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors">
                    <Menu className="h-5 w-5 text-gray-600" />
                  </SidebarTrigger>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                  <AppointmentNotifications />
                  <PendingAttendancesNotification />
                  
                  {currentUserProfile && (
                    <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
                      <div className="text-right hidden lg:block">
                        <p className="text-sm font-semibold text-gray-900">
                          {currentUserProfile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ROLE_LABELS[currentUserProfile.employee_role] || currentUserProfile.employee_role}
                        </p>
                      </div>
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold shadow-md text-sm md:text-base">
                        {currentUserProfile.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            
            {/* Mobile-optimized Content */}
            <main className="flex-1 p-3 md:p-4 lg:p-6">
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