import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { MainApp } from '@/components/MainApp';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showApp, setShowApp] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  console.log('AppContent: Current state', { hasUser: !!user, loading, showApp, showSignUp });

  useEffect(() => {
    console.log('AppContent: useEffect triggered', { hasUser: !!user, loading });
    if (!loading) {
      const shouldShowApp = !!user;
      console.log('AppContent: Setting showApp to', shouldShowApp);
      setShowApp(shouldShowApp);
    }
  }, [user, loading]);

  if (loading) {
    console.log('AppContent: Showing loading screen');
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
    console.log('AppContent: No user, showing auth forms');
    
    if (showSignUp) {
      return (
        <SignUpForm 
          onSuccess={() => {
            console.log('SignUpForm: onSuccess called');
            setShowApp(true);
          }}
          onSwitchToLogin={() => setShowSignUp(false)}
        />
      );
    }
    
    return (
      <LoginForm 
        onSuccess={() => {
          console.log('LoginForm: onSuccess called');
          setShowApp(true);
        }}
        onSwitchToSignUp={() => setShowSignUp(true)}
      />
    );
  }

  console.log('AppContent: User authenticated, showing main app');
  return <MainApp />;
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
