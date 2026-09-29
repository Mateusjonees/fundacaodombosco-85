import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRolePermissions } from '@/hooks/useRolePermissions';

export type StockAccessLevel = 'viewer' | 'manager';

interface StockAccess {
  access_level: StockAccessLevel;
  allowed_units: string[];
}

export const useStockAccess = () => {
  const { user } = useAuth();
  const { userRole, loading: roleLoading } = useRolePermissions();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stock-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: access, error } = await supabase
        .from('stock_user_access')
        .select('access_level, allowed_units')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return access as StockAccess | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const hasFullRoleAccess = userRole === 'director' || userRole === 'estoquista';

  return {
    accessLevel: hasFullRoleAccess ? 'manager' as const : data?.access_level ?? null,
    allowedUnits: hasFullRoleAccess ? ['todas'] : data?.allowed_units ?? [],
    canView: hasFullRoleAccess || data?.access_level === 'viewer' || data?.access_level === 'manager',
    canManage: hasFullRoleAccess || data?.access_level === 'manager',
    isDirector: userRole === 'director',
    loading: roleLoading || isLoading,
    refreshAccess: refetch,
  };
};