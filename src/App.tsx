import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


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

const queryClient = new QueryClient();

const App = () => {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao sair",
          description: error.message,
        });
      } else {
        toast({
          title: "Logout realizado com sucesso",
          description: "Até logo!",
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro inesperado ao fazer logout.",
      });
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <header className="h-12 flex items-center justify-between border-b bg-background px-4">
                  <SidebarTrigger />
                  <div className="flex items-center gap-3">
                    <NotificationBell />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLogout}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
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
                    <Route path="/meeting-alerts" element={<MeetingAlerts />} />
                    <Route path="/custom-roles" element={<CustomRoleManager />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
