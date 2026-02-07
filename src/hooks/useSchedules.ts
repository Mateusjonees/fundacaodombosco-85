import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { offlineDB, STORES } from '@/utils/offlineDB';
import { addToSyncQueue } from '@/utils/syncQueue';

interface ScheduleFilters {
  status?: string;
  employeeId?: string;
  clientId?: string;
  viewMode?: 'day' | 'week';
}

/**
 * Hook otimizado para carregar agendamentos com cache offline
 */
export const useSchedules = (date: Date, userProfile?: any, filters?: ScheduleFilters) => {
  return useQuery({
    queryKey: ['schedules', format(date, 'yyyy-MM-dd'), userProfile?.user_id, filters],
    queryFn: async () => {
      let startDate: Date;
      let endDate: Date;

      if (filters?.viewMode === 'week') {
        const dayOfWeek = date.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(date);
        startDate.setDate(date.getDate() + diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
      }

      if (navigator.onLine) {
        try {
          let query = supabase
            .from('schedules')
            .select(`
              *,
              patient_arrived,
              arrived_at,
              arrived_confirmed_by,
              patient_declined,
              patient_declined_at,
              clients (id, name, phone, cpf, email, unit),
              profiles (id, name, employee_role, phone, unit)
            `)
            .gte('start_time', startDate.toISOString())
            .lte('start_time', endDate.toISOString())
            .in('status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'pending_validation'])
            .order('start_time');

          // Filtros de permissão
          if (userProfile) {
            if (userProfile.employee_role === 'coordinator_madre') {
              const { data: clientsInUnit } = await supabase.from('clients').select('id').or('unit.eq.madre,unit.is.null');
              const clientIds = clientsInUnit?.map(c => c.id) || [];
              if (clientIds.length > 0) query = query.in('client_id', clientIds);
            } else if (userProfile.employee_role === 'coordinator_floresta') {
              const { data: clientsInUnit } = await supabase.from('clients').select('id').eq('unit', 'floresta');
              const clientIds = clientsInUnit?.map(c => c.id) || [];
              if (clientIds.length > 0) query = query.in('client_id', clientIds);
            } else if (userProfile.employee_role === 'coordinator_atendimento_floresta') {
              const { data: clientsInUnit } = await supabase.from('clients').select('id').eq('unit', 'atendimento_floresta');
              const clientIds = clientsInUnit?.map(c => c.id) || [];
              if (clientIds.length > 0) query = query.in('client_id', clientIds);
            } else if (userProfile.employee_role === 'receptionist') {
              const userUnit = userProfile.unit || 'madre';
              const { data: clientsInUnit } = await supabase.from('clients').select('id').eq('unit', userUnit);
              const clientIds = clientsInUnit?.map(c => c.id) || [];
              if (clientIds.length > 0) query = query.in('client_id', clientIds);
            } else if (userProfile.employee_role !== 'director') {
              query = query.eq('employee_id', userProfile.user_id);
            }
          }

          if (filters?.status) query = query.eq('status', filters.status);
          if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);
          if (filters?.clientId) query = query.eq('client_id', filters.clientId);

          const { data, error } = await query;

          if (error) {
            const fallbackQuery = supabase
              .from('schedules')
              .select(`*, clients (name)`)
              .gte('start_time', startDate.toISOString())
              .lte('start_time', endDate.toISOString())
              .in('status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'pending_validation'])
              .order('start_time');
            const { data: fallbackData, error: fallbackError } = await fallbackQuery;
            if (fallbackError) throw fallbackError;
            const result = fallbackData || [];
            await offlineDB.putMany(STORES.schedules, result).catch(() => {});
            return result;
          }

          const result = data || [];
          await offlineDB.putMany(STORES.schedules, result).catch(() => {});
          await offlineDB.setLastSync('schedules').catch(() => {});
          return result;
        } catch (err) {
          console.warn('[useSchedules] Erro online, tentando cache:', err);
        }
      }

      // Fallback offline
      console.log('[useSchedules] Carregando agendamentos do cache offline');
      let cached = await offlineDB.getAll<any>(STORES.schedules);
      
      // Filtrar por data
      cached = cached.filter(s => {
        const t = new Date(s.start_time);
        return t >= startDate && t <= endDate;
      });

      if (filters?.status) cached = cached.filter(s => s.status === filters.status);
      if (filters?.employeeId) cached = cached.filter(s => s.employee_id === filters.employeeId);
      if (filters?.clientId) cached = cached.filter(s => s.client_id === filters.clientId);
      
      cached.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      return cached;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!userProfile,
  });
};

/**
 * Hook para criar agendamento (com suporte offline)
 */
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheduleData: any) => {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('schedules')
          .insert([scheduleData])
          .select()
          .single();
        if (error) throw error;
        await offlineDB.put(STORES.schedules, data).catch(() => {});
        return data;
      }

      // Offline: salva localmente e na fila de sync
      const tempId = crypto.randomUUID();
      const localData = { ...scheduleData, id: tempId, _offline: true };
      await offlineDB.put(STORES.schedules, localData);
      await addToSyncQueue('schedules', 'insert', scheduleData);
      return localData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

/**
 * Hook para atualizar agendamento (com suporte offline)
 */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (navigator.onLine) {
        const { data: updated, error } = await supabase
          .from('schedules')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        await offlineDB.put(STORES.schedules, updated).catch(() => {});
        return updated;
      }

      // Offline
      const existing = await offlineDB.get<any>(STORES.schedules, id);
      const merged = { ...existing, ...data, id };
      await offlineDB.put(STORES.schedules, merged);
      await addToSyncQueue('schedules', 'update', data, id);
      return merged;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

/**
 * Hook para deletar agendamento
 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (navigator.onLine) {
        const { error } = await supabase.from('schedules').delete().eq('id', id);
        if (error) throw error;
      } else {
        await addToSyncQueue('schedules', 'delete', {}, id);
      }
      await offlineDB.delete(STORES.schedules, id).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

/**
 * Hook para carregar agendamentos do dia atual
 */
export const useTodaySchedules = (userProfile?: any) => {
  return useQuery({
    queryKey: ['schedules', 'today', userProfile?.user_id],
    queryFn: async () => {
      if (!userProfile) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (navigator.onLine) {
        try {
          let query = supabase
            .from('schedules')
            .select(`id, title, start_time, status, clients (name), profiles (name)`)
            .gte('start_time', today.toISOString())
            .lt('start_time', tomorrow.toISOString())
            .order('start_time');

          if (userProfile.employee_role === 'staff') {
            query = query.eq('employee_id', userProfile.user_id);
          }

          const { data, error } = await query;
          if (error) throw error;
          return data || [];
        } catch {
          // Fallback
        }
      }

      // Offline
      let cached = await offlineDB.getAll<any>(STORES.schedules);
      cached = cached.filter(s => {
        const t = new Date(s.start_time);
        return t >= today && t < tomorrow;
      });
      cached.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      return cached;
    },
    staleTime: 60000,
    enabled: !!userProfile,
  });
};
