import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';


// Pages
import Dashboard from "./pages/Dashboard";
import ClientForm from "./pages/ClientForm";
import Clients from "./pages/Clients";
import Schedule from "./pages/Schedule";
import MyPatients from "./pages/MyPatients";
import Financial from "./pages/Financial";
import Reports from "./pages/Reports";
import Stock from "./pages/StockManager";
import Employees from "./pages/EmployeesNew";
import UserManagement from "./components/UserManagement";
import MyFiles from "./pages/MyFiles";
import { CustomRoleManager } from "./components/CustomRoleManager";
import NotFound from "./pages/NotFound";
import Timesheet from "./pages/Timesheet";
import MedicalRecords from "./pages/MedicalRecords";
import QualityControl from "./pages/QualityControl";
import Messages from "./pages/Messages";
import MeetingAlerts from "./pages/MeetingAlerts";
import BackupMessages from "./pages/BackupMessages";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  return (
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-12 flex items-center justify-between border-b bg-background px-4">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <NotificationBell />
                </div>
              </header>
              <main className="flex-1 p-4 md:p-6 bg-muted/20">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/client-form" element={<ClientForm />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/my-patients" element={<MyPatients />} />
                  <Route path="/my-files" element={<MyFiles />} />
                  <Route path="/financial" element={<Financial />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/stock" element={<Stock />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/timesheet" element={<Timesheet />} />
                  <Route path="/medical-records" element={<MedicalRecords />} />
                  <Route path="/quality" element={<QualityControl />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/backup-messages" element={<BackupMessages />} />
                  <Route path="/meeting-alerts" element={<MeetingAlerts />} />
                  <Route path="/custom-roles" element={<CustomRoleManager />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showApp, setShowApp] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    if (!loading) {
      const shouldShowApp = !!user;
      setShowApp(shouldShowApp);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showSignUp) {
      return (
        <SignUpForm 
          onSuccess={() => {
            setShowApp(true);
          }}
          onSwitchToLogin={() => setShowSignUp(false)}
        />
      );
    }
    
    return (
      <LoginForm 
        onSuccess={() => {
          setShowApp(true);
        }}
        onSwitchToSignUp={() => setShowSignUp(true)}
      />
    );
  }

  return <AuthenticatedApp />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
