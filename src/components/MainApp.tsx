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
import { ProtectedRoute } from '@/components/ProtectedRoute';

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
import DirectMessages from '@/pages/DirectMessages';
import EmployeeControl from '@/pages/EmployeeControl';
import PendingAttendancesNotification from '@/components/PendingAttendancesNotification';
import AppointmentNotifications from '@/components/AppointmentNotifications';
import { GlobalSearch } from '@/components/GlobalSearch';
import { QuickHelpCenter } from '@/components/QuickHelpCenter';

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
            <header className="bg-card border-b border-border p-4 sticky top-0 z-40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="flex items-center justify-center h-8 w-8 rounded-md border hover:bg-accent">
                    <Menu className="h-4 w-4" />
                  </SidebarTrigger>
                  <h1 className="text-xl font-bold text-primary hidden sm:block">FUNDAÇÃO DOM BOSCO</h1>
                  <h1 className="text-lg font-bold text-primary sm:hidden">FDB</h1>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  <GlobalSearch />
                  <QuickHelpCenter />
                  <AppointmentNotifications />
                  <PendingAttendancesNotification />
                  <div className="text-right hidden lg:block">
                    <Badge variant="secondary" className="mb-1">
                      {currentUserProfile?.name || user?.email}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {currentUserProfile?.employee_role ? ROLE_LABELS[currentUserProfile.employee_role] : 'Carregando...'}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-6">
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute requiredPermission="view_dashboard">
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/clients" element={
                  <ProtectedRoute requiredPermission="view_clients">
                    <Clients />
                  </ProtectedRoute>
                } />
                
                <Route path="/schedule" element={
                  <ProtectedRoute requiredPermission="view_schedules">
                    <Schedule />
                  </ProtectedRoute>
                } />
                
                <Route path="/schedule-control" element={
                  <ProtectedRoute allowedRoles={['director', 'coordinator_madre', 'coordinator_floresta']}>
                    <ScheduleControl />
                  </ProtectedRoute>
                } />
                
                <Route path="/attendance-validation" element={
                  <ProtectedRoute allowedRoles={['director', 'coordinator_madre', 'coordinator_floresta']}>
                    <AttendanceValidation />
                  </ProtectedRoute>
                } />
                
                <Route path="/financial" element={
                  <ProtectedRoute requiredPermission="view_financial">
                    <Financial />
                  </ProtectedRoute>
                } />
                
                <Route path="/contracts" element={
                  <ProtectedRoute requiredPermission="view_contracts">
                    <Contracts />
                  </ProtectedRoute>
                } />
                
                <Route path="/stock" element={
                  <ProtectedRoute requiredPermission="view_stock">
                    <StockManager />
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute requiredPermission="view_reports">
                    <Reports />
                  </ProtectedRoute>
                } />
                
                <Route path="/my-patients" element={
                  <MyPatients />
                } />
                
                <Route path="/employees-new" element={
                  <ProtectedRoute requiredPermission="view_employees">
                    <EmployeesNew />
                  </ProtectedRoute>
                } />
                
                <Route path="/employee-control" element={
                  <ProtectedRoute allowedRoles={['director']}>
                    <EmployeeControl />
                  </ProtectedRoute>
                } />
                
                <Route path="/users" element={
                  <ProtectedRoute requiredPermission="manage_users" allowedRoles={['director']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/messages" element={
                  <DirectMessages />
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </Router>
  );
};