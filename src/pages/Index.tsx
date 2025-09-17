import { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Loader2 } from 'lucide-react';
import App from '../App';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

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
            // Auth state will be handled by AuthProvider
          }}
          onSwitchToLogin={() => setShowSignUp(false)}
        />
      );
    }
    
    return (
      <LoginForm 
        onSuccess={() => {
          // Auth state will be handled by AuthProvider
        }}
        onSwitchToSignUp={() => setShowSignUp(true)}
      />
    );
  }

  return <App />;
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
