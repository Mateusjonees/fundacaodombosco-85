import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, MapPin, FileText, Bell, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClientDetailsView from '@/components/ClientDetailsView';

interface Schedule {
  id: string;
  client_id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  title: string;
  status: string;
  notes?: string;
  unit?: string;
  patient_arrived?: boolean;
  created_by?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  clients?: { name: string };
  profiles?: { name: string };
}

type ViewMode = 'day' | 'week' | 'month';

export default function ScheduleControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [selectedScheduleForNotification, setSelectedScheduleForNotification] = useState<Schedule | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationReason, setNotificationReason] = useState("");

  const handleClientClick = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      
      if (data) {
        setSelectedClient(data);
        setIsClientDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading client details:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os detalhes do paciente.",
      });
    }
  };

  const handleOpenNotificationDialog = (schedule: Schedule) => {
    setSelectedScheduleForNotification(schedule);
    setNotificationMessage("");
    setNotificationReason("");
    setNotificationDialogOpen(true);
  };

  const handleSendNotification = async () => {
    if (!selectedScheduleForNotification || !notificationMessage.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Por favor, escreva uma mensagem para enviar",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    try {
      const schedule = selectedScheduleForNotification;
      
      // Buscar informações do remetente (diretor ou coordenador)
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('name, employee_role')
        .eq('user_id', user.id)
        .single();

      const isDirector = senderProfile?.employee_role === 'director';
      const notificationType = isDirector ? 'director_notification' : 'coordinator_notification';

      // Verificar se o usuário tem permissão
      if (!['director', 'coordinator_madre', 'coordinator_floresta'].includes(senderProfile?.employee_role || '')) {
        toast({
          title: "Sem permissão",
          description: "Apenas diretores e coordenadores podem enviar notificações",
          variant: "destructive",
        });
        return;
      }

      // Inserir notificação
      const { data: notificationData, error: notificationError } = await supabase
        .from('appointment_notifications')
        .insert({
          schedule_id: schedule.id,
          employee_id: schedule.employee_id,
          client_id: schedule.client_id,
          title: notificationReason || 'Notificação da Coordenação',
          message: notificationMessage,
          appointment_date: schedule.start_time,
          appointment_time: format(new Date(schedule.start_time), 'HH:mm'),
          notification_type: notificationType,
          created_by: user.id,
          metadata: {
            status: schedule.status,
            sent_by: senderProfile?.name || 'Gestão',
            sender_role: senderProfile?.employee_role,
            reason: notificationReason,
          }
        })
        .select()
        .single();

      if (notificationError) {
        console.error('Erro ao criar notificação:', notificationError);
        throw new Error(`Falha ao criar notificação: ${notificationError.message || 'Erro desconhecido'}`);
      }

      // Criar mensagem interna automaticamente
      const messageBody = `🔔 **Notificação de Agendamento**

**Motivo:** ${notificationReason || 'Aviso sobre agendamento'}

**Paciente:** ${schedule.clients?.name || 'Não identificado'}
**Data/Hora:** ${format(new Date(schedule.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
**Status:** ${schedule.status === 'scheduled' ? 'Agendado' : schedule.status === 'confirmed' ? 'Confirmado' : schedule.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
**Unidade:** ${schedule.unit === 'madre' ? 'MADRE' : 'Floresta'}

**Mensagem:**
${notificationMessage}

---
📅 Referência: Agendamento #${schedule.id.slice(0, 8)}
📧 Enviado por: ${senderProfile?.name}`;

      const { error: messageError } = await supabase
        .from('internal_messages')
        .insert({
          sender_id: user.id,
          recipient_id: schedule.employee_id,
          subject: notificationReason || 'Notificação sobre Agendamento',
          message_body: messageBody,
          message_type: 'appointment_notification',
          priority: 'high',
          metadata: {
            schedule_id: schedule.id,
            notification_id: notificationData?.id,
            appointment_date: schedule.start_time,
            client_name: schedule.clients?.name,
          }
        });

      if (messageError) {
        console.error('Erro ao criar mensagem interna:', messageError);
        // Não bloqueia o fluxo principal
      }

      toast({
        title: "✅ Notificação enviada",
        description: `Mensagem enviada para ${schedule.profiles?.name} e salva em Mensagens Diretas`,
      });

      setNotificationDialogOpen(false);
      setSelectedScheduleForNotification(null);
      setNotificationMessage("");
      setNotificationReason("");
    } catch (error) {
      console.error('Error sending notification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao enviar notificação",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      loadEmployees();
      loadSchedules();
    }
  }, [userProfile, selectedDate, viewMode, selectedEmployee, selectedUnit]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('user_id, id, name, employee_role')
        .eq('is_active', true)
        .order('name');

      const { data, error } = await query;
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      switch (viewMode) {
        case 'day':
          startDate = new Date(selectedDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(selectedDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate = startOfWeek(selectedDate, { locale: ptBR });
          endDate = endOfWeek(selectedDate, { locale: ptBR });
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate = startOfMonth(selectedDate);
          endDate = endOfMonth(selectedDate);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      let query = supabase
        .from('schedules')
        .select(`
          *,
          clients (name),
          profiles:employee_id (name)
        `)
        .gte('start_time', startDate.toISOString())
        .lt('start_time', endDate.toISOString())
        .order('start_time');

      // Filtros
      if (selectedEmployee !== 'all') {
        query = query.eq('employee_id', selectedEmployee);
      }

      if (selectedUnit !== 'all') {
        query = query.eq('unit', selectedUnit);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (viewMode) {
      case 'day':
        setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(direction === 'next' ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1));
        break;
      case 'month':
        setSelectedDate(direction === 'next' ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1));
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon?: any }> = {
      scheduled: { label: 'Agendado', variant: 'secondary', icon: Clock },
      confirmed: { label: 'Confirmado', variant: 'default', icon: CheckCircle2 },
      completed: { label: 'Concluído', variant: 'outline', icon: CheckCircle2 },
      cancelled: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
      pending: { label: 'Pendente', variant: 'outline', icon: AlertCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  const getDateRangeText = () => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'week':
        const weekStart = startOfWeek(selectedDate, { locale: ptBR });
        const weekEnd = endOfWeek(selectedDate, { locale: ptBR });
        return `${format(weekStart, 'dd/MM', { locale: ptBR })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}`;
      case 'month':
        return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  const groupSchedulesByDate = () => {
    const grouped: Record<string, Schedule[]> = {};
    
    schedules.forEach(schedule => {
      const dateKey = format(new Date(schedule.start_time), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(schedule);
    });

    return grouped;
  };

  const renderDayView = () => {
    // Agrupar agendamentos por hora
    const schedulesByHour: Record<string, Schedule[]> = {};
    
    schedules.forEach(schedule => {
      const hour = format(new Date(schedule.start_time), 'HH:00');
      if (!schedulesByHour[hour]) {
        schedulesByHour[hour] = [];
      }
      schedulesByHour[hour].push(schedule);
    });

    const sortedHours = Object.keys(schedulesByHour).sort();

    return (
      <div className="space-y-6">
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum agendamento encontrado para esta data.
            </CardContent>
          </Card>
        ) : (
          sortedHours.map((hour) => (
            <div key={hour}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{hour}</h3>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>
              <div className="space-y-3">
                {schedulesByHour[hour].map((schedule) => (
                  <Card key={schedule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-base">
                              {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })} - {format(new Date(schedule.end_time), 'HH:mm', { locale: ptBR })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({Math.round((new Date(schedule.end_time).getTime() - new Date(schedule.start_time).getTime()) / 60000)} min)
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <button
                              onClick={() => handleClientClick(schedule.client_id)}
                              className="font-medium text-base hover:text-primary hover:underline transition-colors"
                            >
                              {schedule.clients?.name || 'Paciente não identificado'}
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {schedule.profiles?.name || 'Profissional não atribuído'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <Badge variant={schedule.unit === 'madre' ? 'default' : 'secondary'}>
                              {schedule.unit === 'madre' ? 'MADRE' : 'Floresta'}
                            </Badge>
                          </div>

                          {schedule.title && (
                            <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                              <strong>Tipo:</strong> {schedule.title}
                            </div>
                          )}

                          {/* Observações adicionais para o diretor */}
                          {userProfile?.employee_role === 'director' && schedule.status === 'cancelled' && (
                            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                              <AlertCircle className="h-3 w-3" />
                              <span>Atendimento cancelado</span>
                            </div>
                          )}

                          {schedule.notes && (
                            <div className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded border-l-2 border-blue-500">
                              <strong>Observações:</strong> {schedule.notes}
                            </div>
                          )}

                          {schedule.status === 'cancelled' && schedule.cancellation_reason && (
                            <div className="text-sm bg-destructive/10 text-destructive p-3 rounded border-l-2 border-destructive">
                              <strong>Motivo do cancelamento:</strong> {schedule.cancellation_reason}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(schedule.status)}
                          {schedule.patient_arrived && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Paciente chegou
                            </Badge>
                          )}
                          
                          {/* Botão de notificação para diretores e coordenadores */}
                          {(userProfile?.employee_role === 'director' || 
                            userProfile?.employee_role === 'coordinator_madre' || 
                            userProfile?.employee_role === 'coordinator_floresta') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenNotificationDialog(schedule)}
                              className="gap-2"
                            >
                              <Bell className="h-3 w-3" />
                              Notificar Profissional
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const groupedSchedules = groupSchedulesByDate();
    const weekStart = startOfWeek(selectedDate, { locale: ptBR });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySchedules = groupedSchedules[dateKey] || [];
          
          return (
            <Card key={dateKey} className="flex flex-col">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-semibold">
                  {format(day, "EEE, dd/MM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2 overflow-y-auto max-h-[600px]">
                {daySchedules.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sem agendamentos</p>
                ) : (
                  daySchedules.map((schedule) => (
                    <div key={schedule.id} className="text-xs p-2.5 bg-accent rounded-lg space-y-1.5 border border-border/50 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-semibold flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          <span className="text-[11px]">{format(new Date(schedule.start_time), 'HH:mm')}</span>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(schedule.status)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleClientClick(schedule.client_id)}
                        className="text-left w-full font-medium hover:text-primary hover:underline transition-colors line-clamp-2 text-[11px]"
                      >
                        {schedule.clients?.name}
                      </button>
                      
                      <div className="text-muted-foreground flex items-center gap-1 truncate">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate text-[10px]">{schedule.profiles?.name}</span>
                      </div>

                      <Badge variant={schedule.unit === 'madre' ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0.5">
                        {schedule.unit === 'madre' ? 'MADRE' : 'Floresta'}
                      </Badge>
                      
                      {/* Ações para diretores na visualização semanal */}
                      {userProfile?.employee_role === 'director' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenNotificationDialog(schedule)}
                          className="w-full h-6 text-[9px] gap-1 mt-1 px-2"
                        >
                          <Bell className="h-3 w-3" />
                          Notificar
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const groupedSchedules = groupSchedulesByDate();
    
    return (
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                {(userProfile?.employee_role === 'director' || 
                  userProfile?.employee_role === 'coordinator_madre' || 
                  userProfile?.employee_role === 'coordinator_floresta') && (
                  <TableHead>Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={(userProfile?.employee_role === 'director' || 
                                      userProfile?.employee_role === 'coordinator_madre' || 
                                      userProfile?.employee_role === 'coordinator_floresta') ? 7 : 6} className="text-center text-muted-foreground">
                    Nenhum agendamento encontrado para este mês.
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => (
                  <TableRow key={schedule.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {format(new Date(schedule.start_time), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(schedule.start_time), 'HH:mm')} - {format(new Date(schedule.end_time), 'HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleClientClick(schedule.client_id)}
                        className="hover:text-primary hover:underline transition-colors font-medium"
                      >
                        {schedule.clients?.name || 'N/A'}
                      </button>
                    </TableCell>
                    <TableCell>
                      {schedule.profiles?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={schedule.unit === 'madre' ? 'default' : 'secondary'}>
                        {schedule.unit === 'madre' ? 'MADRE' : 'Floresta'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(schedule.status)}
                        {schedule.patient_arrived && (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Chegou
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {(userProfile?.employee_role === 'director' || 
                      userProfile?.employee_role === 'coordinator_madre' || 
                      userProfile?.employee_role === 'coordinator_floresta') && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenNotificationDialog(schedule)}
                          className="gap-2"
                        >
                          <Bell className="h-3 w-3" />
                          Notificar
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Controle de Agendamentos</h1>
        </div>

        {/* Filtros e navegação */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Seletor de visualização */}
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="flex-1">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="day">Dia</TabsTrigger>
                  <TabsTrigger value="week">Semana</TabsTrigger>
                  <TabsTrigger value="month">Mês</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Navegação de data */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal w-[240px]")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {getDateRangeText()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Filtros */}
              <div className="flex gap-2">
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.user_id} value={emp.user_id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todas as unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    <SelectItem value="madre">MADRE</SelectItem>
                    <SelectItem value="floresta">Floresta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{schedules.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {schedules.filter(s => s.status === 'scheduled').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {schedules.filter(s => s.status === 'confirmed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {schedules.filter(s => s.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-destructive">Cancelados</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-destructive">
                {schedules.filter(s => s.status === 'cancelled').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              Carregando agendamentos...
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
          </>
        )}
      </div>

      {/* Dialog de Detalhes do Cliente */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <ClientDetailsView 
              client={selectedClient}
              onEdit={() => {
                // Recarregar dados do cliente após edição
                if (selectedClient?.id) {
                  handleClientClick(selectedClient.id);
                }
              }}
              onBack={() => setIsClientDialogOpen(false)}
              onRefresh={() => {
                // Recarregar agendamentos após atualização
                loadSchedules();
                if (selectedClient?.id) {
                  handleClientClick(selectedClient.id);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Notificação Personalizada */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notificar Profissional</DialogTitle>
          </DialogHeader>
          
          {selectedScheduleForNotification && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Paciente:</span> {selectedScheduleForNotification.clients?.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Profissional:</span>{" "}
                  {selectedScheduleForNotification.profiles?.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Data/Hora:</span>{" "}
                  {format(new Date(selectedScheduleForNotification.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Status:</span>{" "}
                  {getStatusBadge(selectedScheduleForNotification.status)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-reason">Motivo da Notificação</Label>
                <Select value={notificationReason} onValueChange={setNotificationReason}>
                  <SelectTrigger id="notification-reason">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solicitação de Finalização">Solicitar finalização do atendimento</SelectItem>
                    <SelectItem value="Solicitar Informações">Solicitar informações adicionais</SelectItem>
                    <SelectItem value="Esclarecer Cancelamento">Esclarecer motivo do cancelamento</SelectItem>
                    <SelectItem value="Confirmação de Presença">Confirmar presença do paciente</SelectItem>
                    <SelectItem value="Atualização de Dados">Solicitar atualização de dados</SelectItem>
                    <SelectItem value="Verificação de Status">Verificar status do atendimento</SelectItem>
                    <SelectItem value="Outro">Outro motivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-message">Mensagem *</Label>
                <Textarea
                  id="notification-message"
                  placeholder="Escreva sua mensagem aqui... Seja claro sobre o que precisa que o profissional faça."
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={6}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {notificationMessage.length}/500 caracteres
                </p>
              </div>

              {selectedScheduleForNotification.status === 'cancelled' && (
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Atendimento Cancelado
                  </p>
                  {selectedScheduleForNotification.cancellation_reason && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Motivo: {selectedScheduleForNotification.cancellation_reason}
                    </p>
                  )}
                </div>
              )}

              {selectedScheduleForNotification.status === 'confirmed' && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    ✓ Atendimento Confirmado
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O profissional já confirmou este atendimento
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotificationDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={!notificationMessage.trim()}
            >
              <Bell className="h-4 w-4 mr-2" />
              Enviar Notificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
