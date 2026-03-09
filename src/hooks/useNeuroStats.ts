import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NeuroStats {
  totalPatients: number;
  pendingReports: number;
  deliveredReports: number;
  overdueReports: number;
  upcomingDeadlines: number; // próximos 7 dias
  totalHours: number;
}

/**
 * Hook compartilhado para estatísticas de neuroavaliação
 * Usado no Dashboard e na página Neuroassessment
 */
export const useNeuroStats = (enabled = true) => {
  return useQuery({
    queryKey: ['neuro', 'stats'],
    queryFn: async (): Promise<NeuroStats> => {
      const today = new Date().toISOString().split('T')[0];
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Buscar pacientes floresta com campos neuro relevantes
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, neuro_report_file_path, neuro_report_deadline')
        .eq('unit', 'floresta');

      if (error) throw error;

      const allClients = clients || [];
      const pending = allClients.filter(c => !c.neuro_report_file_path);
      const delivered = allClients.filter(c => !!c.neuro_report_file_path);
      const overdue = pending.filter(c => c.neuro_report_deadline && c.neuro_report_deadline < today);
      const upcoming = pending.filter(c => 
        c.neuro_report_deadline && 
        c.neuro_report_deadline >= today && 
        c.neuro_report_deadline <= in7Days
      );

      // Buscar horas totais de atendimentos neuro
      const clientIds = allClients.map(c => c.id);
      let totalMinutes = 0;
      if (clientIds.length > 0) {
        const { data: attendances } = await supabase
          .from('attendance_reports')
          .select('session_duration')
          .in('client_id', clientIds)
          .eq('status', 'completed');

        totalMinutes = attendances?.reduce((sum, a) => sum + (a.session_duration || 0), 0) || 0;
      }

      return {
        totalPatients: allClients.length,
        pendingReports: pending.length,
        deliveredReports: delivered.length,
        overdueReports: overdue.length,
        upcomingDeadlines: upcoming.length,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      };
    },
    staleTime: 120000,
    enabled,
  });
};
