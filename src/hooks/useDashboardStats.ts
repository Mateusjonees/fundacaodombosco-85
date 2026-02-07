import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';
import { offlineDB, STORES } from '@/utils/offlineDB';

/**
 * Hook otimizado para carregar estatísticas do dashboard com cache offline
 */
export const useDashboardStats = (userProfile?: any) => {
  return useQuery({
    queryKey: ['dashboard', 'stats', userProfile?.user_id, userProfile?.employee_role],
    queryFn: async () => {
      if (!userProfile) return null;

      if (navigator.onLine) {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const monthStart = startOfMonth(today);
          const monthEnd = endOfMonth(today);

          const isDirector = userProfile.employee_role === 'director';
          const isCoordinator = userProfile.employee_role === 'coordinator_madre' || 
                              userProfile.employee_role === 'coordinator_floresta' ||
                              userProfile.employee_role === 'coordinator_atendimento_floresta';
          const isStaff = !isDirector && !isCoordinator;

          const [clientsResult, todaySchedulesResult, monthlyRevenueResult, employeesResult] = await Promise.all([
            (async () => {
              if (isStaff) {
                const { count } = await supabase.from('client_assignments').select('client_id', { count: 'exact', head: true }).eq('employee_id', userProfile.user_id).eq('is_active', true);
                return count || 0;
              }
              const { count } = await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('is_active', true);
              return count || 0;
            })(),
            (async () => {
              let query = supabase.from('schedules').select('id', { count: 'exact', head: true }).gte('start_time', today.toISOString()).lt('start_time', tomorrow.toISOString());
              if (isStaff) query = query.eq('employee_id', userProfile.user_id);
              const { count } = await query;
              return count || 0;
            })(),
            (async () => {
              if (isStaff) return 0;
              const [financialRecords, clientPayments, automaticRecords] = await Promise.all([
                supabase.from('financial_records').select('amount').eq('type', 'income').gte('date', monthStart.toISOString().split('T')[0]).lte('date', monthEnd.toISOString().split('T')[0]),
                supabase.from('client_payments').select('amount_paid').gte('created_at', monthStart.toISOString()).lte('created_at', monthEnd.toISOString()),
                supabase.from('automatic_financial_records').select('amount').eq('transaction_type', 'income').gte('payment_date', monthStart.toISOString()).lte('payment_date', monthEnd.toISOString())
              ]);
              return (financialRecords.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0) +
                (clientPayments.data?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0) +
                (automaticRecords.data?.reduce((sum, a) => sum + Number(a.amount), 0) || 0);
            })(),
            (async () => {
              if (isStaff) return 0;
              const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).not('employee_role', 'is', null).eq('is_active', true);
              return count || 0;
            })()
          ]);

          const stats = {
            key: 'dashboard_stats',
            totalClients: clientsResult,
            todayAppointments: todaySchedulesResult,
            monthlyRevenue: monthlyRevenueResult,
            totalEmployees: employeesResult,
          };

          // Cache offline
          await offlineDB.put(STORES.dashboardStats, stats).catch(() => {});
          return stats;
        } catch (err) {
          console.warn('[useDashboardStats] Erro online, tentando cache:', err);
        }
      }

      // Fallback offline
      const cached = await offlineDB.get<any>(STORES.dashboardStats, 'dashboard_stats');
      return cached || { totalClients: 0, todayAppointments: 0, monthlyRevenue: 0, totalEmployees: 0 };
    },
    staleTime: 60000,
    enabled: !!userProfile,
  });
};
