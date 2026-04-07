import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { offlineDB, STORES } from '@/utils/offlineDB';
import type { EmployeeRole } from './useRolePermissions';

interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  employee_role: EmployeeRole | null;
  phone: string | null;
  document_cpf: string | null;
  is_active: boolean | null;
  hire_date: string | null;
  department: string | null;
  unit: string | null;
  address: string | null;
  birth_date: string | null;
  document_rg: string | null;
  salary: number | null;
  permissions: any | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook centralizado para carregar perfil do usuário atual
 * Com fallback offline via IndexedDB
 */
export const useCurrentUser = () => {
  const { user } = useAuth();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Tentar buscar online primeiro
      if (navigator.onLine) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;

          // Salvar no IndexedDB para uso offline
          if (data) {
            await offlineDB.put(STORES.userSession, {
              key: `profile_${user.id}`,
              data,
              timestamp: Date.now(),
            }).catch(() => {});
          }

          return data as UserProfile | null;
        } catch (err) {
          console.warn('[useCurrentUser] Erro online, tentando cache:', err);
        }
      }

      // Fallback offline: buscar do IndexedDB
      console.log('[useCurrentUser] Carregando perfil do cache offline');
      const cached = await offlineDB.get<{ key: string; data: UserProfile; timestamp: number }>(
        STORES.userSession,
        `profile_${user.id}`
      );
      return cached?.data || null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!user?.id,
  });

  return {
    profile,
    loading: isLoading,
    error,
    refetch,
    // Helpers convenientes
    userName: profile?.name || user?.email || '',
    userRole: profile?.employee_role,
    userUnit: profile?.unit,
    isActive: profile?.is_active ?? false,
    avatarUrl: profile?.avatar_url || null,
  };
};
