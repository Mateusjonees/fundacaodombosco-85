import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Bell, Calendar, X, AlertCircle, MessageSquare, Clock, User, Check } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface MeetingAlert {
  id: string;
  title: string;
  message: string;
  meeting_date: string;
  meeting_location?: string;
  meeting_room?: string;
  participants: string[];
}

interface AppointmentNotification {
  id: string;
  title: string;
  message: string;
  appointment_date: string;
  appointment_time: string;
  is_read: boolean;
  created_at: string;
  metadata: any;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Usar hook centralizado para evitar query duplicada
  const { userRole, userUnit } = useCurrentUser();
  
  // Calcular permissões de forma memorizada
  const hasAttendancePermission = useMemo(() => {
    const allowedRoles = ['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta'];
    return userRole ? allowedRoles.includes(userRole) : false;
  }, [userRole]);

  // Query de notificações gerais
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as Notification[];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!user?.id,
  });

  // Query de alertas de reunião
  const { data: meetingAlerts = [] } = useQuery({
    queryKey: ['meeting-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('meeting_alerts')
        .select('*')
        .contains('participants', [user.id])
        .eq('is_active', true)
        .gte('meeting_date', new Date().toISOString())
        .order('meeting_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return (data || []) as MeetingAlert[];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!user?.id,
  });

  // Query de notificações de agendamento
  const { data: appointmentNotifications = [] } = useQuery({
    queryKey: ['appointment-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('appointment_notifications')
        .select('*')
        .eq('employee_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as AppointmentNotification[];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!user?.id,
  });

  // Query de mensagens não lidas
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('internal_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)
        .is('channel_id', null);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 30 * 1000,
    enabled: !!user?.id,
  });

  // Carregar contagem de atendimentos pendentes - usa permissões do hook centralizado
  useEffect(() => {
    if (!hasAttendancePermission) return;

    const loadPendingCount = async () => {
      try {
        if (userRole === 'director') {
          const { count, error } = await supabase
            .from('attendance_reports')
            .select('*', { count: 'exact', head: true })
            .eq('validation_status', 'pending_validation');

          if (error) throw error;
          setPendingCount(count || 0);
          return;
        }

        const { data: attendances, error } = await supabase
          .from('attendance_reports')
          .select('id, schedule_id')
          .eq('validation_status', 'pending_validation');

        if (error) throw error;

        if (!attendances || attendances.length === 0) {
          setPendingCount(0);
          return;
        }

        const scheduleIds = attendances.map(a => a.schedule_id).filter(Boolean);
        
        if (scheduleIds.length === 0) {
          setPendingCount(0);
          return;
        }

        const { data: schedules, error: schedulesError } = await supabase
          .from('schedules')
          .select('id, unit')
          .in('id', scheduleIds);

        if (schedulesError) throw schedulesError;

        const scheduleUnitMap = new Map<string, string>();
        schedules?.forEach(s => {
          if (s.unit) scheduleUnitMap.set(s.id, s.unit);
        });

        let coordinatorUnit: string | null = null;
        
        if (userRole === 'coordinator_madre') {
          coordinatorUnit = 'madre';
        } else if (userRole === 'coordinator_floresta') {
          coordinatorUnit = 'floresta';
        } else if (userRole === 'coordinator_atendimento_floresta') {
          coordinatorUnit = 'atendimento_floresta';
        }

        let filteredCount = 0;
        
        if (coordinatorUnit) {
          attendances.forEach(a => {
            const scheduleUnit = a.schedule_id ? scheduleUnitMap.get(a.schedule_id) : null;
            if (scheduleUnit === coordinatorUnit) {
              filteredCount++;
            }
          });
        } else {
          attendances.forEach(a => {
            const scheduleUnit = a.schedule_id ? scheduleUnitMap.get(a.schedule_id) : null;
            if (scheduleUnit === userUnit || !scheduleUnit) {
              filteredCount++;
            }
          });
        }

        setPendingCount(filteredCount);
      } catch (error) {
        console.error('Error loading pending count:', error);
      }
    };

    loadPendingCount();
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, [hasAttendancePermission, userRole, userUnit]);

  // Realtime para reuniões
  useEffect(() => {
    if (!user?.id) return;

    const meetingChannel = supabase
      .channel('meeting_alerts_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meeting_alerts' },
        (payload) => {
          const newMeeting = payload.new as MeetingAlert;
          if (newMeeting.participants?.includes(user.id)) {
            queryClient.invalidateQueries({ queryKey: ['meeting-alerts'] });
            toast({
              title: "Nova Reunião Agendada",
              description: `${newMeeting.title} - ${formatMeetingDate(newMeeting.meeting_date)}`,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'meeting_alerts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['meeting-alerts'] });
        }
      )
      .subscribe();

    // Realtime para notificações de agendamento
    const appointmentChannel = supabase
      .channel('appointment-notifications-bell')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointment_notifications',
          filter: `employee_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['appointment-notifications'] });
        }
      )
      .subscribe();

    // Realtime para mensagens
    const messagesChannel = supabase
      .channel('messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(meetingChannel);
      supabase.removeChannel(appointmentChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id, queryClient, toast]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      // Silent fail
    }
  };

  const markAppointmentAsRead = async (notificationId: string) => {
    try {
      await supabase.rpc('mark_notification_as_read', {
        p_notification_id: notificationId
      });

      queryClient.invalidateQueries({ queryKey: ['appointment-notifications'] });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const totalUnread = notifications.length + meetingAlerts.length + appointmentNotifications.length + unreadMessages + (hasAttendancePermission ? pendingCount : 0);

  const formatMeetingDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Amanhã às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Notificações</span>
              {totalUnread > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalUnread} {totalUnread === 1 ? 'nova' : 'novas'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-8">
                <TabsTrigger value="all" className="text-xs">
                  Todas
                </TabsTrigger>
                <TabsTrigger value="messages" className="text-xs relative">
                  Msg
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="meetings" className="text-xs relative">
                  Reuniões
                  {meetingAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                      {meetingAlerts.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="attendance" className="text-xs relative">
                  Atend.
                  {hasAttendancePermission && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-80">
                <TabsContent value="all" className="m-0 p-3 space-y-3">
                  {totalUnread === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma notificação nova
                    </p>
                  ) : (
                    <>
                      {/* Mensagens não lidas */}
                      {unreadMessages > 0 && (
                        <div 
                          className="flex items-center space-x-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors"
                          onClick={() => {
                            navigate('/messages');
                            setIsOpen(false);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Mensagens não lidas</p>
                            <p className="text-xs text-muted-foreground">
                              {unreadMessages} {unreadMessages === 1 ? 'mensagem' : 'mensagens'} aguardando
                            </p>
                          </div>
                          <Badge variant="default">{unreadMessages}</Badge>
                        </div>
                      )}

                      {/* Atendimentos pendentes */}
                      {hasAttendancePermission && pendingCount > 0 && (
                        <div 
                          className="flex items-center space-x-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors"
                          onClick={() => {
                            navigate('/attendance-validation');
                            setIsOpen(false);
                          }}
                        >
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Atendimentos Pendentes</p>
                            <p className="text-xs text-muted-foreground">
                              {pendingCount} {pendingCount === 1 ? 'atendimento' : 'atendimentos'} para validar
                            </p>
                          </div>
                          <Badge variant="destructive">{pendingCount}</Badge>
                        </div>
                      )}

                      {/* Alertas de reunião */}
                      {meetingAlerts.map(alert => (
                        <div key={alert.id} className="flex items-start space-x-3 p-3 bg-primary/5 rounded-lg border">
                          <Calendar className="h-4 w-4 text-primary mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatMeetingDate(alert.meeting_date)}
                            </p>
                            {alert.meeting_location && (
                              <p className="text-xs text-muted-foreground">
                                📍 {alert.meeting_location}
                                {alert.meeting_room && ` - ${alert.meeting_room}`}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Notificações de agendamento */}
                      {appointmentNotifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className="flex items-start space-x-3 p-3 bg-green-500/5 rounded-lg border cursor-pointer hover:bg-green-500/10 transition-colors"
                          onClick={() => markAppointmentAsRead(notification.id)}
                        >
                          <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground">{notification.message}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(notification.appointment_date)} - {notification.appointment_time}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAppointmentAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {/* Notificações gerais */}
                      {notifications.map(notification => (
                        <div key={notification.id} className="flex items-start space-x-3 p-3 bg-background rounded-lg border">
                          <Bell className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="messages" className="m-0 p-3">
                  {unreadMessages === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma mensagem não lida
                    </p>
                  ) : (
                    <div 
                      className="flex items-center space-x-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors"
                      onClick={() => {
                        navigate('/messages');
                        setIsOpen(false);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Ir para Mensagens</p>
                        <p className="text-xs text-muted-foreground">
                          {unreadMessages} {unreadMessages === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
                        </p>
                      </div>
                      <Badge variant="default">{unreadMessages}</Badge>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="meetings" className="m-0 p-3 space-y-3">
                  {meetingAlerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma reunião agendada
                    </p>
                  ) : (
                    meetingAlerts.map(alert => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 bg-primary/5 rounded-lg border">
                        <Calendar className="h-4 w-4 text-primary mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatMeetingDate(alert.meeting_date)}
                          </p>
                          {alert.meeting_location && (
                            <p className="text-xs text-muted-foreground">
                              📍 {alert.meeting_location}
                              {alert.meeting_room && ` - ${alert.meeting_room}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="attendance" className="m-0 p-3">
                  {!hasAttendancePermission ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Você não tem permissão para ver atendimentos pendentes
                    </p>
                  ) : pendingCount === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum atendimento pendente de validação
                    </p>
                  ) : (
                    <div 
                      className="flex items-center space-x-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors"
                      onClick={() => {
                        navigate('/attendance-validation');
                        setIsOpen(false);
                      }}
                    >
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Validar Atendimentos</p>
                        <p className="text-xs text-muted-foreground">
                          {pendingCount} {pendingCount === 1 ? 'atendimento pendente' : 'atendimentos pendentes'}
                        </p>
                      </div>
                      <Badge variant="destructive">{pendingCount}</Badge>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
