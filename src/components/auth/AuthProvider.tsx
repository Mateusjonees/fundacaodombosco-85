import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuditService } from '@/services/auditService';

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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log authentication events
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            AuditService.logAction({
              entityType: 'auth',
              action: 'login_success',
              metadata: { 
                user_email: session.user.email,
                login_method: 'email_password'
              }
            });
            AuditService.updateUserActivity();
          }, 0);
          
          const userData = session.user.user_metadata;
          
          if (userData?.employee_role) {
            try {
              // Wait a bit for the profile to be created by the trigger
              setTimeout(async () => {
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
          setTimeout(() => {
            AuditService.logAction({
              entityType: 'auth',
              action: 'logout_completed',
              metadata: { timestamp: new Date().toISOString() }
            });
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('AuthProvider: Error getting initial session', error);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};