import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { useNeuroStats } from '@/hooks/useNeuroStats';
import { useNavigate } from 'react-router-dom';

/**
 * Banner de alertas de prazos vencidos de laudos neuro
 * Exibe no topo da página de Neuroavaliação
 */
export const NeuroDeadlineAlerts = () => {
  const { data: stats } = useNeuroStats();
  const navigate = useNavigate();

  if (!stats || (stats.overdueReports === 0 && stats.upcomingDeadlines === 0)) return null;

  return (
    <div className="space-y-2">
      {stats.overdueReports > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-destructive font-medium">
            {stats.overdueReports} laudo{stats.overdueReports > 1 ? 's' : ''} com prazo vencido
          </span>
          <button
            onClick={() => navigate('/neuroassessment')}
            className="ml-auto flex items-center gap-1 text-xs text-destructive/80 hover:text-destructive transition-colors"
          >
            Ver detalhes <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
      {stats.upcomingDeadlines > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-amber-700 dark:text-amber-300 font-medium">
            {stats.upcomingDeadlines} laudo{stats.upcomingDeadlines > 1 ? 's' : ''} vencem nos próximos 7 dias
          </span>
        </div>
      )}
    </div>
  );
};
