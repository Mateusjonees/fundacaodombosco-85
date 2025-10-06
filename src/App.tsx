import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { Loader2 } from 'lucide-react';

// Lazy load componentes principais para reduzir bundle inicial
const LoginForm = lazy(() => import("@/components/auth/LoginForm").then(m => ({ default: m.LoginForm })));
const SignUpForm = lazy(() => import("@/components/auth/SignUpForm").then(m => ({ default: m.SignUpForm })));
const MainApp = lazy(() => import("@/components/MainApp").then(m => ({ default: m.MainApp })));

const queryClient = new QueryClient();


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
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </div>
        }>
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
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      }>
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <MainApp />
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
