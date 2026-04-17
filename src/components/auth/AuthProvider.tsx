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

  const syncAuthState = (nextSession: Session | null, offline = false) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    setIsOfflineSession(offline);

    if (!nextSession) {
      setMustChangePassword(false);
    }
  };

  const hydrateSessionProfile = async (
    activeSession: Session,
    options: { logLogin?: boolean } = {}
  ) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_active, employee_role, must_change_password')
        .eq('user_id', activeSession.user.id)
        .maybeSingle();

      if (error) {
        console.error('AuthProvider: Error checking user status', error);
        return;
      }

      if (profile && !profile.is_active) {
        await supabase.auth.signOut();
        return;
      }

      setMustChangePassword(profile?.must_change_password === true);

      await offlineDB.put(STORES.userSession, {
        key: 'profile',
        data: {
          user_id: activeSession.user.id,
          employee_role: profile?.employee_role,
          is_active: profile?.is_active,
        },
        timestamp: Date.now(),
      }).catch(() => {});

      if (profile?.employee_role) {
        void preloadCriticalData(activeSession.user.id, profile.employee_role);
      }

      if (options.logLogin) {
        void AuditService.logAction({
          entityType: 'auth',
          action: 'login_success',
          metadata: {
            user_email: activeSession.user.email,
            login_method: 'email_password'
          }
        });
        AuditService.updateUserActivity();
      }
    } catch (error) {
      console.error('AuthProvider: Error in login validation', error);
    }
  };

  const handleSignedOutSideEffects = async () => {
    await Promise.allSettled([
      offlineDB.clear(STORES.clients),
      offlineDB.clear(STORES.schedules),
      offlineDB.clear(STORES.medicalRecords),
      offlineDB.clear(STORES.dashboardStats),
      offlineDB.clear(STORES.userSession),
    ]);

    void AuditService.logAction({
      entityType: 'auth',
      action: 'logout_completed',
      metadata: { timestamp: new Date().toISOString() }
    });
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        syncAuthState(nextSession, false);

        // IMPORTANTE: nunca await dentro do onAuthStateChange
        if (event === 'SIGNED_IN' && nextSession?.user) {
          window.setTimeout(() => {
            void hydrateSessionProfile(nextSession, { logLogin: true });
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          window.setTimeout(() => {
            void handleSignedOutSideEffects();
          }, 0);
        }

        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // Get initial session — com timeout para nunca travar em "loading" infinito.
    const sessionTimeout = window.setTimeout(() => {
      if (isMounted) {
        console.warn('[AuthProvider] getSession demorou demais — liberando UI sem sessão');
        setLoading(false);
      }
    }, 8000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      window.clearTimeout(sessionTimeout);
      console.log('[AuthProvider] getSession ok, session?', !!session);
      syncAuthState(session, false);

      if (session?.user) {
        void hydrateSessionProfile(session);
      }

      if (isMounted) {
        setLoading(false);
      }
    }).catch((error) => {
      window.clearTimeout(sessionTimeout);
      console.error('AuthProvider: Error getting initial session', error);

      // OFFLINE FALLBACK: Se não conseguiu buscar sessão online,
      // tentar usar sessão cached do localStorage
      if (!navigator.onLine) {
        console.log('AuthProvider: Offline - tentando sessão cached');
        const cached = getOfflineSession();
        if (cached) {
          syncAuthState(cached.session, true);
          setMustChangePassword(false);
          console.log('AuthProvider: Sessão offline restaurada com sucesso');
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      window.clearTimeout(sessionTimeout);
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, mustChangePassword, setMustChangePassword, isOfflineSession }}>
      {children}
    </AuthContext.Provider>
  );
};
