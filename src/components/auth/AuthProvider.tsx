import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuditService } from '@/services/auditService';
import { useAppPreload } from '@/hooks/useAppPreload';
import { offlineDB, STORES } from '@/utils/offlineDB';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mustChangePassword: boolean;
  setMustChangePassword: (value: boolean) => void;
  isOfflineSession: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  mustChangePassword: false,
  setMustChangePassword: () => {},
  isOfflineSession: false,
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

/**
 * Tenta recuperar sessão do localStorage quando offline
 * O Supabase salva a sessão em "sb-<ref>-auth-token"
 */
const getOfflineSession = (): { user: User; session: Session } | null => {
  try {
    const storageKey = 'sb-vqphtzkdhfzdwbumexhe-auth-token';
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Supabase armazena como { currentSession: { ... } } ou diretamente
    const session = parsed?.currentSession || parsed;
    if (!session?.user || !session?.access_token) return null;

    // Verificar se o token não expirou (com margem de 24h para offline)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      // Permitir até 7 dias após expiração para uso offline
      const offlineGrace = 7 * 24 * 60 * 60;
      if (now > expiresAt + offlineGrace) return null;
    }

    return { user: session.user, session };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isOfflineSession, setIsOfflineSession] = useState(false);
  const { preloadCriticalData } = useAppPreload();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsOfflineSession(false);
        
        // Check if user is active when logging in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_active, employee_role, must_change_password')
                .eq('user_id', session.user.id)
                .single();
              
              if (error) {
                console.error('AuthProvider: Error checking user status', error);
                return;
              }
              
              // If user is inactive, sign them out immediately
              if (profile && !profile.is_active) {
                await supabase.auth.signOut();
                return;
              }
              
              // Check if user must change password
              if (profile && profile.must_change_password === true) {
                setMustChangePassword(true);
              } else {
                setMustChangePassword(false);
              }

              // Salvar perfil no IndexedDB para uso offline
              await offlineDB.put(STORES.userSession, {
                key: 'profile',
                data: {
                  user_id: session.user.id,
                  employee_role: profile.employee_role,
                  is_active: profile.is_active,
                },
                timestamp: Date.now(),
              }).catch(() => {});

              // Pré-carregar dados críticos para performance
              if (profile?.employee_role) {
                preloadCriticalData(session.user.id, profile.employee_role);
              }
              
              // Continue with normal login process
              AuditService.logAction({
                entityType: 'auth',
                action: 'login_success',
                metadata: { 
                  user_email: session.user.email,
                  login_method: 'email_password'
                }
              });
              AuditService.updateUserActivity();
            } catch (error) {
              console.error('AuthProvider: Error in login validation', error);
            }
          }, 0);
        }
        
        if (event === 'SIGNED_OUT') {
          // Limpar cache offline para evitar dados residuais entre sessões
          offlineDB.clear(STORES.clients).catch(() => {});
          offlineDB.clear(STORES.schedules).catch(() => {});
          offlineDB.clear(STORES.medicalRecords).catch(() => {});
          offlineDB.clear(STORES.dashboardStats).catch(() => {});
          offlineDB.clear(STORES.userSession).catch(() => {});
          
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
      
      // Preload data immediately if we have a session
      if (session?.user) {
        supabase
          .from('profiles')
          .select('employee_role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.employee_role) {
              preloadCriticalData(session.user.id, data.employee_role);
            }
          });
      }
      
      setLoading(false);
    }).catch((error) => {
      console.error('AuthProvider: Error getting initial session', error);
      
      // OFFLINE FALLBACK: Se não conseguiu buscar sessão online,
      // tentar usar sessão cached do localStorage
      if (!navigator.onLine) {
        console.log('AuthProvider: Offline - tentando sessão cached');
        const cached = getOfflineSession();
        if (cached) {
          setUser(cached.user);
          setSession(cached.session);
          setIsOfflineSession(true);
          setMustChangePassword(false); // Não forçar troca de senha offline
          console.log('AuthProvider: Sessão offline restaurada com sucesso');
        }
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, mustChangePassword, setMustChangePassword, isOfflineSession }}>
      {children}
    </AuthContext.Provider>
  );
};
