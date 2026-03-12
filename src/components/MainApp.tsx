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
import { ScreenOrientationToggle } from '@/components/ScreenOrientationToggle';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { PageTransition } from '@/components/ui/page-transition';
import { NotificationEventsBridge } from '@/components/notifications/NotificationEventsBridge';

// Lazy load header components - melhor LCP
const GlobalSearch = lazy(() => import('@/components/GlobalSearch').then(m => ({ default: m.GlobalSearch })));
const QuickHelpCenter = lazy(() => import('@/components/QuickHelpCenter').then(m => ({ default: m.QuickHelpCenter })));
const NotificationBell = lazy(() => import('@/components/NotificationBell').then(m => ({ default: m.NotificationBell })));
import { NotificationPermissionButton } from '@/components/NotificationPermissionButton';

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
const WaitingList = lazy(() => import('@/pages/WaitingList'));
const Install = lazy(() => import('@/pages/Install'));

// Memoized route config to avoid re-creating on every render
const AppRoutes = memo(() => (
  <Suspense fallback={<PageSkeleton />}>
    <PageTransition>
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
        <Route path="/waiting-list" element={<ProtectedRoute allowedRoles={['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist']}><WaitingList /></ProtectedRoute>} />
        <Route path="/install" element={<Install />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
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
          <NotificationEventsBridge />
          
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-150 ease-out">
            {/* Header — clean & modern */}
            <header className="bg-background/70 backdrop-blur-md border-b border-border/50 px-3 sm:px-4 py-1.5 sm:py-2 sticky top-0 z-40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors duration-150" />
                  <span className="hidden sm:block text-[13px] font-medium text-foreground/70 tracking-tight">
                    Fundação Dom Bosco
                  </span>
                  <span className="text-[11px] font-medium text-foreground/60 sm:hidden">Clínica</span>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Suspense fallback={<div className="h-8 w-8" />}>
                    <QuickHelpCenter />
                  </Suspense>
                  <Suspense fallback={<div className="h-8 w-20 sm:w-24 bg-muted rounded-md animate-pulse" />}>
                    <GlobalSearch />
                  </Suspense>
                  <Suspense fallback={<div className="h-8 w-8 bg-muted rounded-md animate-pulse" />}>
                    <NotificationBell />
                  </Suspense>
                  <NotificationPermissionButton />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAiOpen(true)}
                    className="h-8 w-8 rounded-md hover:bg-muted/60 p-0 overflow-hidden"
                    title="Bia IA"
                  >
                    <img src={boscoIcon} alt="Bia IA" className="h-6 w-6 object-cover rounded-md" />
                  </Button>
                  <AIAssistant open={aiOpen} onOpenChange={setAiOpen} />
                  
                  <div className="h-5 w-px bg-border/60 mx-0.5 hidden sm:block" />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0 overflow-hidden">
                        <UserAvatar 
                          name={userName}
                          avatarUrl={avatarUrl}
                          role={userRole}
                          size="sm"
                          className="h-8 w-8"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 z-50 p-0 rounded-lg border shadow-lg overflow-hidden">
                      {/* User info */}
                      <div className="px-3 py-3 border-b border-border/50">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar 
                            name={userName}
                            avatarUrl={avatarUrl}
                            role={userRole}
                            size="sm"
                          />
                          <div className="flex flex-col min-w-0">
                            <p className="text-[13px] font-semibold text-foreground leading-tight uppercase truncate">
                              {userName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {userRole ? ROLE_LABELS[userRole] : 'Carregando...'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-1">
                        <DropdownMenuItem 
                          onClick={() => setProfileDialogOpen(true)} 
                          className="cursor-pointer rounded-md px-2.5 py-2 gap-2.5 text-[13px]"
                        >
                          <Camera className="h-4 w-4 text-muted-foreground" />
                          <span>Meu Perfil</span>
                        </DropdownMenuItem>
                        
                        <div className="px-2.5" onClick={(e) => e.stopPropagation()}>
                          <ThemeToggle />
                        </div>
                        
                        <DropdownMenuItem asChild className="cursor-pointer rounded-md px-2.5 py-2 gap-2.5 text-[13px]">
                          <Link to="/messages" className="flex items-center">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>Mensagens</span>
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-1" />
                        
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-md px-2.5 py-2 gap-2.5 text-[13px] text-destructive focus:text-destructive">
                          <LogOut className="h-4 w-4" />
                          <span>Sair</span>
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
          <ScreenOrientationToggle />
          <ScrollToTop />
        </div>
      </SidebarProvider>
    </Router>
  );
};
