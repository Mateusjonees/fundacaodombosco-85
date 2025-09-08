import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
    console.log('AuthProvider: Initializing auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed', { event, hasSession: !!session, hasUser: !!session?.user });
        setSession(session);
        setUser(session?.user ?? null);
        
        // If user just signed up, update their profile with additional data
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('AuthProvider: User signed in, checking if profile needs update');
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
                } else {
                  console.log('AuthProvider: Profile updated successfully');
                }
              }, 1000);
            } catch (error) {
              console.error('AuthProvider: Unexpected error updating profile', error);
            }
          }
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthProvider: Initial session check', { hasSession: !!session, hasUser: !!session?.user });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('AuthProvider: Error getting initial session', error);
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};