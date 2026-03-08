import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Props {
  userId?: string;
  isAdmin?: boolean;
}

export const DashboardUpcomingAppointments = ({ userId, isAdmin }: Props) => {
  const navigate = useNavigate();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['dashboard', 'upcoming-appointments', userId, isAdmin],
    queryFn: async () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      let query = supabase
        .from('schedules')
        .select('id, start_time, end_time, title, status, clients(name), profiles!schedules_employee_id_fkey(name)')
        .gte('start_time', now.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .in('status', ['scheduled', 'confirmed'])
        .order('start_time', { ascending: true })
        .limit(5);

      if (!isAdmin && userId) {
        query = query.eq('employee_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/schedule')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Próximos Atendimentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {appointments.length === 0 ? (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum atendimento restante hoje</p>
          </div>
        ) : (
          appointments.map((apt: any) => (
            <div
              key={apt.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="text-center min-w-[48px]">
                <p className="text-sm font-bold text-primary">
                  {format(new Date(apt.start_time), 'HH:mm')}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {(apt.clients as any)?.name || 'Paciente'}
                </p>
                {isAdmin && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {(apt.profiles as any)?.name || ''}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {apt.title}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
