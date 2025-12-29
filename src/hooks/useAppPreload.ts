import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Hook para pré-carregar dados críticos do sistema após login
 * Isso melhora significativamente a performance da navegação
 */
export const useAppPreload = () => {
  const queryClient = useQueryClient();

  const preloadCriticalData = async (userId: string, userRole: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');

    const isDirector = userRole === 'director';
    const isCoordinator = userRole?.startsWith('coordinator');

    try {
      // 1. Perfil do usuário
      queryClient.prefetchQuery({
        queryKey: ['user-profile', userId],
        queryFn: async () => {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          return data;
        },
        staleTime: 5 * 60 * 1000,
      });

      // 2. Ponto eletrônico de hoje
      queryClient.prefetchQuery({
        queryKey: ['timesheet-today', userId],
        queryFn: async () => {
          const { data } = await supabase
            .from('employee_timesheet')
            .select('*')
            .eq('employee_id', userId)
            .eq('date', today)
            .maybeSingle();
          return data;
        },
        staleTime: 30 * 1000,
      });

      // 3. Pacientes vinculados
      queryClient.prefetchQuery({
        queryKey: ['my-clients', userId],
        queryFn: async () => {
          if (isDirector || isCoordinator) {
            const { data } = await supabase
              .from('clients')
              .select('id, name, cpf, phone, unit, is_active')
              .eq('is_active', true)
              .order('name')
              .limit(100);
            return data || [];
          }
          
          const { data: assignments } = await supabase
            .from('client_assignments')
            .select('client_id')
            .eq('employee_id', userId)
            .eq('is_active', true);
          
          if (!assignments?.length) return [];
          
          const clientIds = assignments.map(a => a.client_id).filter(Boolean);
          const { data: clients } = await supabase
            .from('clients')
            .select('id, name, cpf, phone, unit, is_active')
            .in('id', clientIds)
            .eq('is_active', true)
            .order('name');
          
          return clients || [];
        },
        staleTime: 2 * 60 * 1000,
      });

      // 4. Agendamentos da semana
      queryClient.prefetchQuery({
        queryKey: ['schedules-week', weekStart, weekEnd],
        queryFn: async () => {
          let query = supabase
            .from('schedules')
            .select('id, client_id, employee_id, schedule_date, start_time, end_time, status, notes, unit, service_type')
            .gte('schedule_date', weekStart)
            .lte('schedule_date', weekEnd)
            .order('schedule_date')
            .order('start_time');

          if (!isDirector && !isCoordinator) {
            query = query.eq('employee_id', userId);
          }

          const { data } = await query.limit(200);
          return data || [];
        },
        staleTime: 60 * 1000,
      });

      // 5. Dados para coordenadores e diretores
      if (isDirector || isCoordinator) {
        queryClient.prefetchQuery({
          queryKey: ['employees-list'],
          queryFn: async () => {
            const { data } = await supabase
              .from('profiles')
              .select('user_id, name, employee_role, unit, is_active')
              .eq('is_active', true)
              .order('name')
              .limit(100);
            return data || [];
          },
          staleTime: 5 * 60 * 1000,
        });
      }

      console.log('✅ Dados críticos pré-carregados com sucesso');
    } catch (error) {
      console.warn('⚠️ Alguns dados não puderam ser pré-carregados:', error);
    }
  };

  return { preloadCriticalData };
};
