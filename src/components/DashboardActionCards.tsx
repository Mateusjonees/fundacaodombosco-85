import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, ListOrdered, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Cards de ação rápida para o Dashboard: Pendentes de Validação e Fila de Espera
 */
export const DashboardActionCards = () => {
  const navigate = useNavigate();

  // Atendimentos pendentes de validação
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['dashboard', 'pending-validations'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('attendance_reports')
        .select('id', { count: 'exact', head: true })
        .eq('validation_status', 'pending');
      if (error) throw error;
      return count || 0;
    },
    staleTime: 60000,
  });

  // Pacientes na fila de espera
  const { data: waitingData } = useQuery({
    queryKey: ['dashboard', 'waiting-list-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waiting_list')
        .select('priority')
        .eq('status', 'waiting');
      if (error) throw error;

      const total = data?.length || 0;
      const urgent = data?.filter(w => w.priority === 'urgent' || w.priority === 'high').length || 0;
      return { total, urgent };
    },
    staleTime: 60000,
  });

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      {/* Pendentes de Validação */}
      <Card
        className="cursor-pointer hover:shadow-md transition-all hover:border-amber-500/50 group"
        onClick={() => navigate('/attendance-validation')}
      >
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1 sm:space-y-2 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
                Pendentes Validação
              </p>
              <p className="text-xl sm:text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                {pendingCount}
              </p>
            </div>
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-600/10">
              <ClipboardCheck className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          {pendingCount > 0 && (
            <p className="text-[10px] text-amber-600 mt-1 font-medium">
              ⚠️ Requer atenção
            </p>
          )}
        </CardContent>
      </Card>

      {/* Fila de Espera */}
      <Card
        className="cursor-pointer hover:shadow-md transition-all hover:border-rose-500/50 group"
        onClick={() => navigate('/waiting-list')}
      >
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1 sm:space-y-2 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
                Fila de Espera
              </p>
              <p className="text-xl sm:text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
                {waitingData?.total || 0}
              </p>
            </div>
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-rose-600/10">
              <ListOrdered className="h-4 w-4 sm:h-6 sm:w-6 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          {(waitingData?.urgent || 0) > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-rose-600" />
              <p className="text-[10px] text-rose-600 font-medium">
                {waitingData?.urgent} urgente(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
