import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { supabase } from "@/integrations/supabase/client";
import { checkForUpdates } from "@/utils/cacheControl";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";

// Lazy load components para reduzir bundle inicial
const LoginForm = lazy(() => import("@/components/auth/LoginForm").then(m => ({ default: m.LoginForm })));
const SignUpForm = lazy(() => import("@/components/auth/SignUpForm").then(m => ({ default: m.SignUpForm })));
const MainApp = lazy(() => import("@/components/MainApp").then(m => ({ default: m.MainApp })));
const ChangeOwnPasswordDialog = lazy(() => import("@/components/ChangeOwnPasswordDialog").then(m => ({ default: m.ChangeOwnPasswordDialog })));

// QueryClient otimizado com cache agressivo e deduplicação
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      refetchOnMount: false, // Evitar refetch ao montar componente se dados em cache
    },
    mutations: {
      retry: 0,
    },
  },
});


const AppContent = () => {
  const { user, loading, mustChangePassword, setMustChangePassword } = useAuth();
  const [showApp, setShowApp] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    if (!loading) {
      const shouldShowApp = !!user;
      setShowApp(shouldShowApp);
    }
  }, [user, loading]);

  // Fetch user name for the password change dialog
  useEffect(() => {
    if (user) {
      // First try user metadata, then fetch from profiles
      if (user.user_metadata?.name) {
        setUserName(user.user_metadata.name);
      } else {
        supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.name) setUserName(data.name);
          });
      }
    }
  }, [user]);

  // Loading spinner minimalista
  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    if (showSignUp) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <SignUpForm 
            onSuccess={() => {
              setShowApp(true);
            }}
            onSwitchToLogin={() => setShowSignUp(false)}
          />
        </Suspense>
      );
    }
    
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginForm 
          onSuccess={() => {
            setShowApp(true);
          }}
          onSwitchToSignUp={() => setShowSignUp(true)}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MainApp />
      <ChangeOwnPasswordDialog
        isOpen={mustChangePassword}
        onSuccess={() => setMustChangePassword(false)}
        userName={userName}
      />
    </Suspense>
  );
};

const App = () => {
  // Verifica se há nova versão ao iniciar
  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <AppContent />
            <PWAInstallBanner />
            <NotificationPermissionBanner />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
