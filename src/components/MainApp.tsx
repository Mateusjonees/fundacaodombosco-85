import { lazy, Suspense, useState, memo, useMemo, useCallback } from 'react';
import { AIAssistant } from '@/components/AIAssistant';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuditLog } from '@/hooks/useAuditLog';
import { LogOut, Camera, MessageSquare } from 'lucide-react';
import boscoIcon from '@/assets/bosco-ia-icon.png';
import { ROLE_LABELS } from '@/hooks/useRolePermissions';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link } from 'react-router-dom';
import { PageSkeleton } from '@/components/ui/page-skeletons';
import { UserAvatar } from '@/components/UserAvatar';
import { PageBreadcrumb } from '@/components/ui/page-breadcrumb';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

// Lazy load header components - melhor LCP
const GlobalSearch = lazy(() => import('@/components/GlobalSearch').then(m => ({ default: m.GlobalSearch })));
const QuickHelpCenter = lazy(() => import('@/components/QuickHelpCenter').then(m => ({ default: m.QuickHelpCenter })));
const NotificationBell = lazy(() => import('@/components/NotificationBell').then(m => ({ default: m.NotificationBell })));
const UserProfileDialog = lazy(() => import('@/components/UserProfileDialog').then(m => ({ default: m.UserProfileDialog })));

// Lazy load page components
const Clients = lazy(() => import('@/pages/Clients'));
const Schedule = lazy(() => import('@/pages/Schedule'));
const ScheduleControl = lazy(() => import('@/pages/ScheduleControl'));
const Financial = lazy(() => import('@/pages/Financial'));
const Contracts = lazy(() => import('@/pages/Contracts'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const StockManager = lazy(() => import('@/pages/StockManager'));
const Reports = lazy(() => import('@/pages/Reports'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const MyPatients = lazy(() => import('@/pages/MyPatients'));
const MedicalRecords = lazy(() => import('@/pages/MedicalRecords'));
const AttendanceValidation = lazy(() => import('@/pages/AttendanceValidation'));
const EmployeesNew = lazy(() => import('@/pages/EmployeesNew'));
const DirectMessages = lazy(() => import('@/pages/DirectMessages'));
const EmployeeControl = lazy(() => import('@/pages/EmployeeControl'));
const FeedbackControl = lazy(() => import('@/pages/FeedbackControl'));
const MyFiles = lazy(() => import('@/pages/MyFiles'));
const Timesheet = lazy(() => import('@/pages/Timesheet'));
const MeetingAlerts = lazy(() => import('@/pages/MeetingAlerts'));
const Neuroassessment = lazy(() => import('@/pages/Neuroassessment'));
const ContractTemplates = lazy(() => import('@/pages/ContractTemplates'));
const CustomRoles = lazy(() => import('@/pages/CustomRoles'));
const Anamnesis = lazy(() => import('@/pages/Anamnesis'));
const Install = lazy(() => import('@/pages/Install'));

// Memoized route config to avoid re-creating on every render
const AppRoutes = memo(() => (
  <Suspense fallback={<PageSkeleton />}>
    <Routes>
      <Route path="/" element={<ProtectedRoute requiredPermission="view_dashboard"><Dashboard /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute requiredPermission="view_clients"><Clients /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute requiredPermission="view_schedules"><Schedule /></ProtectedRoute>} />
      <Route path="/schedule-control" element={<ProtectedRoute allowedRoles={['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist']}><ScheduleControl /></ProtectedRoute>} />
      <Route path="/attendance-validation" element={<ProtectedRoute allowedRoles={['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist']}><AttendanceValidation /></ProtectedRoute>} />
      <Route path="/feedback-control" element={<ProtectedRoute allowedRoles={['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta']}><FeedbackControl /></ProtectedRoute>} />
      <Route path="/financial" element={<ProtectedRoute requiredPermission="view_financial"><Financial /></ProtectedRoute>} />
      <Route path="/contracts" element={<ProtectedRoute requiredPermission="view_contracts"><Contracts /></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute requiredPermission="view_stock"><StockManager /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute requiredPermission="view_reports"><Reports /></ProtectedRoute>} />
      <Route path="/my-patients" element={<MyPatients />} />
      <Route path="/medical-records" element={<ProtectedRoute requiredPermission="view_medical_records"><MedicalRecords /></ProtectedRoute>} />
      <Route path="/employees-new" element={<ProtectedRoute requiredPermission="view_employees"><EmployeesNew /></ProtectedRoute>} />
      <Route path="/employee-control" element={<ProtectedRoute allowedRoles={['director']}><EmployeeControl /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute requiredPermission="manage_users" allowedRoles={['director']}><UserManagement /></ProtectedRoute>} />
      <Route path="/messages" element={<DirectMessages />} />
      <Route path="/my-files" element={<ProtectedRoute requiredPermission="view_files"><MyFiles /></ProtectedRoute>} />
      <Route path="/timesheet" element={<ProtectedRoute requiredPermission="view_timesheet"><Timesheet /></ProtectedRoute>} />
      <Route path="/meeting-alerts" element={<MeetingAlerts />} />
      <Route path="/neuroassessment" element={<ProtectedRoute allowedRoles={['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'psychologist', 'psychopedagogue']}><Neuroassessment /></ProtectedRoute>} />
      <Route path="/contract-templates" element={<ProtectedRoute allowedRoles={['director']}><ContractTemplates /></ProtectedRoute>} />
      <Route path="/custom-roles" element={<ProtectedRoute allowedRoles={['director']}><CustomRoles /></ProtectedRoute>} />
      <Route path="/anamnesis" element={<ProtectedRoute allowedRoles={['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist', 'musictherapist', 'terapeuta_ocupacional', 'terapeuta_ocupacional_integracao']}><Anamnesis /></ProtectedRoute>} />
      <Route path="/install" element={<Install />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
));
AppRoutes.displayName = 'AppRoutes';

export const MainApp = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  
  const { profile, userName, userRole, avatarUrl } = useCurrentUser();

  const handleLogout = useCallback(async () => {
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
  }, [logAction, toast, user?.email]);

  return (
    <Router>
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen w-full flex">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-150 ease-out">
            {/* Header */}
            <header className="bg-card/80 backdrop-blur-lg border-b border-border/60 px-3 sm:px-6 py-2 sm:py-3 sticky top-0 z-40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4">
                  <SidebarTrigger className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-border/60 bg-background/80 hover:bg-accent transition-all duration-200" />
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="h-6 w-0.5 rounded-full bg-primary/30" />
                    <h1 className="text-base font-bold text-foreground tracking-tight">FUNDAÇÃO DOM BOSCO</h1>
                  </div>
                  <h1 className="text-xs font-bold text-foreground sm:hidden">Clínica</h1>
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-4">
                  <Suspense fallback={<div className="h-8 w-8" />}>
                    <QuickHelpCenter />
                  </Suspense>
                  <Suspense fallback={<div className="h-9 w-20 sm:w-24 bg-muted rounded-lg animate-pulse" />}>
                    <GlobalSearch />
                  </Suspense>
                  <Suspense fallback={<div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />}>
                    <NotificationBell />
                  </Suspense>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAiOpen(true)}
                    className="h-9 w-9 rounded-xl hover:bg-primary/10 p-0 overflow-hidden"
                    title="Bosco IA"
                  >
                    <img src={boscoIcon} alt="Bosco IA" className="h-7 w-7 object-cover rounded-lg" />
                  </Button>
                  <AIAssistant open={aiOpen} onOpenChange={setAiOpen} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10 p-0 overflow-hidden">
                        <UserAvatar 
                          name={userName}
                          avatarUrl={avatarUrl}
                          role={userRole}
                          size="sm"
                          className="h-9 w-9 sm:h-10 sm:w-10"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 bg-card/95 backdrop-blur-xl z-50 p-0 rounded-2xl border shadow-xl overflow-hidden">
                      {/* Header com gradiente */}
                      <div className="relative px-4 pt-5 pb-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                        <div className="flex items-center gap-3">
                          <div className="ring-2 ring-primary/20 rounded-full p-0.5">
                            <UserAvatar 
                              name={userName}
                              avatarUrl={avatarUrl}
                              role={userRole}
                              size="md"
                            />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-sm font-bold text-foreground leading-tight uppercase">
                              {userName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {userRole ? ROLE_LABELS[userRole] : 'Carregando...'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-1.5">
                        <DropdownMenuItem 
                          onClick={() => setProfileDialogOpen(true)} 
                          className="cursor-pointer rounded-xl px-3 py-2.5 gap-3 focus:bg-muted/80"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Camera className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">Meu Perfil</span>
                        </DropdownMenuItem>
                        
                        <div className="px-3 pt-3 pb-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Configurações</p>
                        </div>
                        
                        <div className="px-1" onClick={(e) => e.stopPropagation()}>
                          <ThemeToggle />
                        </div>
                        
                        <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5 gap-3 focus:bg-muted/80">
                          <Link to="/messages" className="flex items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium">Mensagens</span>
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-1.5" />
                        
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-xl px-3 py-2.5 gap-3 text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                            <LogOut className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">Sair</span>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Suspense fallback={null}>
                    <UserProfileDialog 
                      open={profileDialogOpen} 
                      onOpenChange={setProfileDialogOpen} 
                    />
                  </Suspense>
                </div>
              </div>
            </header>

             <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-20 md:pb-6 landscape-main">
               <PageBreadcrumb />
               <AppRoutes />
             </main>
          </div>
          <MobileBottomNav />
        </div>
      </SidebarProvider>
    </Router>
  );
};
