import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuditService } from '@/services/auditService';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const { toast } = useToast();

  // Check if user is active
  const checkUserActiveStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('user_id', userId)
        .single();

      if (error || !data?.is_active) {
        // User is inactive, sign them out
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Acesso Negado",
          description: "Sua conta foi desativada. Entre em contato com o administrador.",
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking user status:', error);
      return true; // In case of error, allow access
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || isProcessingAuth) return;
        
        setIsProcessingAuth(true);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log authentication events
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user is active before completing login
          const isActive = await checkUserActiveStatus(session.user.id);
          if (!isActive) {
            setIsProcessingAuth(false);
            return; // User was signed out due to inactive status
          }

          // Avoid multiple simultaneous audit calls
          try {
            await AuditService.logAction({
              entityType: 'auth',
              action: 'login_success',
              metadata: { 
                user_email: session.user.email,
                login_method: 'email_password'
              }
            });
            await AuditService.updateUserActivity();
          } catch (error) {
            console.error('Error logging auth events:', error);
          }
          
          const userData = session.user.user_metadata;
          
          if (userData?.employee_role && mounted) {
            try {
              // Wait a bit for the profile to be created by the trigger
              setTimeout(async () => {
                if (!mounted) return;
                
                const { error } = await supabase
                  .from('profiles')
                  .update({
                    employee_role: userData.employee_role,
                    phone: userData.phone,
                  })
                  .eq('user_id', session.user.id);
                  
                if (error) {
                  console.error('AuthProvider: Error updating profile', error);
                }
              }, 1000);
            } catch (error) {
              console.error('AuthProvider: Unexpected error updating profile', error);
            }
          }
        }
        
        if (event === 'SIGNED_OUT') {
          try {
            await AuditService.logAction({
              entityType: 'auth',
              action: 'logout_completed',
              metadata: { timestamp: new Date().toISOString() }
            });
          } catch (error) {
            console.error('Error logging logout:', error);
          }
        }
        
        setLoading(false);
        setIsProcessingAuth(false);
      }
    );

    // Get initial session - Add proper error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('AuthProvider: Error getting initial session', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      if (!mounted) return;
      console.error('AuthProvider: Error getting initial session', error);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isProcessingAuth]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};