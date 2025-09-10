import { useState, useEffect } from 'react';
import { Bell, Clock, User, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { format, isToday, isAfter, isBefore, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  client_id: string;
  employee_id: string;
  notes?: string;
  clients?: {
    name: string;
  };
  profiles?: {
    name: string;
  };
}

export function ScheduleAlerts() {
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTodaySchedules();
      // Atualizar a cada 5 minutos
      const interval = setInterval(loadTodaySchedules, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadTodaySchedules = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Buscar agendamentos do dia para o usuário atual ou seus clientes vinculados
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select(`
          *,
          clients(name),
          profiles(name)
        `)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .or(`employee_id.eq.${user.id},client_id.in.(${await getUserLinkedClients()})`)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const schedulesForToday = schedules || [];
      
      // Separar agendamentos próximos (próximos 30 minutos)
      const upcoming = schedulesForToday.filter(schedule => {
        const scheduleTime = new Date(schedule.start_time);
        const timeDiff = scheduleTime.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 30 * 60 * 1000; // próximos 30 minutos
      });

      setTodaySchedules(schedulesForToday);
      setUpcomingSchedules(upcoming);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLinkedClients = async (): Promise<string> => {
    if (!user) return '';
    
    try {
      const { data: assignments } = await supabase
        .from('client_assignments')
        .select('client_id')
        .eq('employee_id', user.id)
        .eq('is_active', true);
      
      return assignments?.map(a => a.client_id).join(',') || '';
    } catch (error) {
      console.error('Erro ao buscar clientes vinculados:', error);
      return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'confirmed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) return null;

  if (!isVisible || (todaySchedules.length === 0 && upcomingSchedules.length === 0)) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      {/* Alerta de agendamentos próximos */}
      {upcomingSchedules.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-amber-800">
                  {upcomingSchedules.length} agendamento{upcomingSchedules.length > 1 ? 's' : ''} próximo{upcomingSchedules.length > 1 ? 's' : ''}
                </span>
                <div className="text-sm text-amber-700 mt-1">
                  {upcomingSchedules.slice(0, 2).map((schedule, index) => (
                    <div key={schedule.id} className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })} - 
                      {schedule.clients?.name || 'Cliente não informado'}
                    </div>
                  ))}
                  {upcomingSchedules.length > 2 && (
                    <div className="text-xs">+{upcomingSchedules.length - 2} mais</div>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="text-amber-700 hover:text-amber-800"
              >
                ×
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Card com agendamentos do dia */}
      {todaySchedules.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              Agendamentos de Hoje ({todaySchedules.length})
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="ml-auto text-muted-foreground"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {todaySchedules.slice(0, 5).map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-sm">
                  <div className="flex items-center gap-2 flex-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {schedule.clients?.name || 'Cliente não informado'}
                    </span>
                  </div>
                  <Badge variant="secondary" className={`text-xs text-white ${getStatusColor(schedule.status)}`}>
                    {getStatusLabel(schedule.status)}
                  </Badge>
                </div>
              ))}
              {todaySchedules.length > 5 && (
                <div className="text-xs text-center text-muted-foreground py-1">
                  +{todaySchedules.length - 5} agendamentos restantes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}