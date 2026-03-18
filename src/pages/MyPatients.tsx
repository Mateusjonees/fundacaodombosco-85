import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import CompleteAttendanceDialog from '@/components/CompleteAttendanceDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientDetailsModal } from '@/components/PatientDetailsModal';
import { StatsCard } from '@/components/ui/stats-card';
import { 
  Heart, 
  Search, 
  Calendar as CalendarIcon, 
  Phone, 
  MapPin, 
  User, 
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Eye,
  CalendarCheck,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, addMonths, subMonths, isToday as isDateToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ClientDetailsView from '@/components/ClientDetailsView';

interface Client {
  id: string;
  name: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  unit?: string;
  responsible_name?: string;
  responsible_phone?: string;
  is_active: boolean;
  last_session_date?: string;
  created_at: string;
}

interface Schedule {
  id: string;
  client_id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  title: string;
  status: string;
  notes?: string;
  clients?: { name: string };
}

type ViewMode = 'day' | 'week' | 'month';

const MyPatients: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const permissions = useRolePermissions();
  const [clients, setClients] = useState<Client[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [completeSchedule, setCompleteSchedule] = useState<Schedule | null>(null);
  const [patientModalClientId, setPatientModalClientId] = useState<string | null>(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);

  // Stats state
  const [weekAppointments, setWeekAppointments] = useState(0);
  const [monthCompleted, setMonthCompleted] = useState(0);
  const [nextAppointment, setNextAppointment] = useState<string | null>(null);
  const [sessionCounts, setSessionCounts] = useState<Map<string, number>>(new Map());

  const openPatientModal = (clientId: string) => {
    setPatientModalClientId(clientId);
    setPatientModalOpen(true);
  };

  useEffect(() => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você precisa estar logado para ver esta página.",
      });
      return;
    }

    loadMyPatients();
    loadMySchedules();
    loadStats();
  }, [user, selectedDate, viewMode]);

  const loadStats = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Atendimentos da semana
      const { count: weekCount } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .in('status', ['scheduled', 'confirmed', 'completed']);

      setWeekAppointments(weekCount || 0);

      // Concluídos no mês
      const { count: monthCount } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .eq('status', 'completed')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString());

      setMonthCompleted(monthCount || 0);

      // Próxima consulta
      const { data: nextData } = await supabase
        .from('schedules')
        .select('start_time, clients(name)')
        .eq('employee_id', user.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('start_time', now.toISOString())
        .order('start_time', { ascending: true })
        .limit(1);

      if (nextData && nextData.length > 0) {
        const next = nextData[0];
        const nextDate = new Date(next.start_time);
        const clientName = (next.clients as any)?.name || 'Paciente';
        setNextAppointment(`${format(nextDate, 'HH:mm')} - ${clientName}`);
      } else {
        setNextAppointment(null);
      }

      // Contagem de sessões por paciente
      const { data: sessionsData } = await supabase
        .from('schedules')
        .select('client_id')
        .eq('employee_id', user.id)
        .eq('status', 'completed');

      if (sessionsData) {
        const counts = new Map<string, number>();
        sessionsData.forEach(s => {
          counts.set(s.client_id, (counts.get(s.client_id) || 0) + 1);
        });
        setSessionCounts(counts);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadMySchedules = async () => {
    if (!user) return;

    try {
      let rangeStart: Date, rangeEnd: Date;
      if (viewMode === 'day') {
        rangeStart = new Date(selectedDate);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(selectedDate);
        rangeEnd.setHours(23, 59, 59, 999);
      } else if (viewMode === 'month') {
        rangeStart = startOfMonth(selectedDate);
        rangeEnd = endOfMonth(selectedDate);
      } else {
        rangeStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        rangeEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      }

      let query = supabase
        .from('schedules')
        .select(`
          id,
          client_id,
          employee_id,
          start_time,
          end_time,
          title,
          status,
          notes,
          clients (name)
        `)
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .order('start_time');

      const { data: assignedClients } = await supabase
        .from('client_assignments')
        .select('client_id')
        .eq('employee_id', user.id)
        .eq('is_active', true);

      if (!assignedClients || assignedClients.length === 0) {
        setSchedules([]);
        return;
      }

      const clientIds = assignedClients.map(a => a.client_id);
      query = query.in('client_id', clientIds);

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadMyPatients = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('client_assignments')
        .select(`
          client_id,
          clients (
            id,
            name,
            birth_date,
            phone,
            address,
            unit,
            responsible_name,
            responsible_phone,
            is_active,
            last_session_date,
            created_at
          )
        `)
        .eq('employee_id', user.id)
        .eq('is_active', true)
        .eq('clients.is_active', true);

      if (error) throw error;
      
      const clientsData = (data || [])
        .filter(assignment => assignment.clients)
        .map(assignment => assignment.clients)
        .filter(Boolean) as Client[];

      setClients(clientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar pacientes",
        description: "Não foi possível carregar a lista de pacientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const daysSinceLastSession = (dateString?: string) => {
    if (!dateString) return null;
    const today = new Date();
    const lastSession = new Date(dateString);
    const diffTime = Math.abs(today.getTime() - lastSession.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'no_show': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'no_show': return 'Faltou';
      default: return status;
    }
  };

  const getDaySchedules = (date: Date) => {
    return schedules.filter(schedule => 
      isSameDay(new Date(schedule.start_time), date)
    );
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      const newDate = direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
      setSelectedDate(newDate);
    } else if (viewMode === 'month') {
      const newDate = direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1);
      setSelectedDate(newDate);
    } else {
      const newWeekStart = direction === 'prev' 
        ? subDays(currentWeekStart, 7)
        : addDays(currentWeekStart, 7);
      setCurrentWeekStart(newWeekStart);
      setSelectedDate(newWeekStart);
    }
  };

  const getMonthDays = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days: Date[] = [];
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  };

  const getPeriodLabel = () => {
    if (viewMode === 'day') {
      return format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
    } else if (viewMode === 'month') {
      return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
    return `${format(currentWeekStart, "dd/MM", { locale: ptBR })} - ${format(addDays(currentWeekStart, 6), "dd/MM", { locale: ptBR })}`;
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.responsible_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Próximo agendamento por paciente
  const nextAppointmentByClient = useMemo(() => {
    const now = new Date();
    const map = new Map<string, Date>();
    schedules
      .filter(s => ['scheduled', 'confirmed'].includes(s.status) && new Date(s.start_time) >= now)
      .forEach(s => {
        const existing = map.get(s.client_id);
        const sDate = new Date(s.start_time);
        if (!existing || sDate < existing) {
          map.set(s.client_id, sDate);
        }
      });
    return map;
  }, [schedules]);

  if (loading) {
    return (
      <div className="w-full p-3 sm:p-6 space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-6 space-y-4 sm:space-y-6">
        <>
          {/* Cabeçalho */}
          <div className="flex flex-col gap-3 sm:gap-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="relative pl-3 sm:pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 rounded-full" />
                <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                  Meus Pacientes
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Gerencie seus pacientes e agenda
                </p>
              </div>
              <Badge className="text-sm sm:text-lg px-3 sm:px-6 py-2 sm:py-3 shrink-0 bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 dark:text-green-400 border-green-500/20">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                {filteredClients.length}
              </Badge>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard
              title="Pacientes Vinculados"
              value={clients.length}
              icon={<Heart className="h-5 w-5" />}
              variant="blue"
            />
            <StatsCard
              title="Atendimentos na Semana"
              value={weekAppointments}
              icon={<CalendarCheck className="h-5 w-5" />}
              variant="green"
            />
            <StatsCard
              title="Concluídos no Mês"
              value={monthCompleted}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="purple"
            />
            <StatsCard
              title="Próximo Atendimento"
              value={nextAppointment ? '' : '—'}
              subtitle={nextAppointment || 'Sem agendamentos'}
              icon={<Activity className="h-5 w-5" />}
              variant="orange"
            />
          </div>

          {/* Agenda */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
            <CardHeader className="relative border-b px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="font-bold text-primary">
                      {viewMode === 'day' ? 'Agenda do Dia' : viewMode === 'month' ? 'Agenda do Mês' : 'Agenda da Semana'}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
                      <Button
                        key={mode}
                        size="sm"
                        variant={viewMode === mode ? 'default' : 'ghost'}
                        onClick={() => setViewMode(mode)}
                        className="h-7 px-2 sm:px-3 text-xs"
                      >
                        {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')} className="h-8 w-8 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-xs sm:text-sm min-w-[160px] sm:min-w-[220px] text-center text-primary capitalize">
                    {getPeriodLabel()}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')} className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-3 text-xs ml-1">
                    Hoje
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative p-3 sm:p-6">
              {viewMode === 'day' ? (
                <div className="space-y-2">
                  {getDaySchedules(selectedDate).length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">Sem agendamentos para este dia</div>
                  ) : (
                    getDaySchedules(selectedDate).map(schedule => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="text-primary font-bold text-sm flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(schedule.start_time), 'HH:mm')}
                          </div>
                          <div>
                            <div 
                              className="font-medium text-sm uppercase text-primary cursor-pointer hover:underline"
                              onClick={() => schedule.client_id && openPatientModal(schedule.client_id)}
                            >
                              {schedule.clients?.name || schedule.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant={getStatusColor(schedule.status)} className="text-[10px]">
                                {getStatusLabel(schedule.status)}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{schedule.title}</span>
                            </div>
                          </div>
                        </div>
                        {(schedule.status === 'scheduled' || schedule.status === 'confirmed') && (
                          <Button size="sm" variant="outline" onClick={() => setCompleteSchedule(schedule)} className="gap-1 text-xs">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Finalizar</span>
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : viewMode === 'month' ? (
                <div className="grid grid-cols-7 gap-1">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                    <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1">{d}</div>
                  ))}
                  {Array.from({ length: (startOfMonth(selectedDate).getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {getMonthDays().map(day => {
                    const dayScheds = getDaySchedules(day);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toDateString()}
                        onClick={() => { setSelectedDate(day); setViewMode('day'); }}
                        className={`p-1 sm:p-2 border rounded-lg text-center cursor-pointer transition-all hover:shadow-md min-h-[40px] sm:min-h-[60px] ${
                          isToday ? 'bg-primary/10 border-primary/40' : 'hover:border-primary/20'
                        }`}
                      >
                        <div className={`text-xs sm:text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                          {format(day, 'd')}
                        </div>
                        {dayScheds.length > 0 && (
                          <div className="mt-0.5">
                            <Badge variant="secondary" className="text-[9px] px-1 py-0">{dayScheds.length}</Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex md:grid md:grid-cols-7 gap-2 sm:gap-4 overflow-x-auto pb-2 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none">
                  {getWeekDays().map((day) => {
                    const daySchedules = getDaySchedules(day);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div 
                        key={day.toDateString()} 
                        className={`group flex-shrink-0 w-[120px] sm:w-[140px] md:w-auto snap-center p-2 sm:p-4 border rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer ${
                          isToday 
                            ? 'bg-primary/10 border-primary/40 shadow-md' 
                            : 'bg-gradient-to-br from-background to-muted/20 hover:border-primary/20'
                        }`}
                        onClick={() => { setSelectedDate(day); setViewMode('day'); }}
                      >
                        <div className="text-center mb-2 sm:mb-3">
                          <div className={`font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                            isToday ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {format(day, 'EEE', { locale: ptBR })}
                          </div>
                          <div className={`text-xl sm:text-3xl font-extrabold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                            {format(day, 'dd', { locale: ptBR })}
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          {daySchedules.length === 0 ? (
                            <div className="text-[10px] sm:text-xs text-muted-foreground text-center py-2 sm:py-4 bg-muted/30 rounded-lg">Sem agenda</div>
                          ) : (
                            daySchedules.slice(0, 3).map((schedule) => (
                              <div key={schedule.id} className="p-2 sm:p-3 bg-card border rounded-lg text-xs hover:shadow-md transition-all duration-200">
                                <div className="font-bold text-xs sm:text-sm text-primary flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })}
                                </div>
                                <div 
                                  className="text-foreground truncate font-medium mt-0.5 text-[10px] sm:text-xs uppercase cursor-pointer hover:text-primary transition-colors"
                                  onClick={(e) => { e.stopPropagation(); schedule.client_id && openPatientModal(schedule.client_id); }}
                                >
                                  {schedule.clients?.name || 'Cliente N/A'}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <Badge variant={getStatusColor(schedule.status)} className="text-[9px] px-1 py-0">
                                    {getStatusLabel(schedule.status)}
                                  </Badge>
                                  {['scheduled', 'confirmed'].includes(schedule.status) && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={(e) => { e.stopPropagation(); setCompleteSchedule(schedule); }}
                                      className="h-5 px-1.5 text-[9px] text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-0.5" />
                                      Finalizar
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                          {daySchedules.length > 3 && (
                            <div className="text-[10px] sm:text-xs text-center text-primary font-medium">
                              +{daySchedules.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Barra de Pesquisa */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-blue-500/5">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  placeholder="Pesquisar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-12 h-10 sm:h-12 text-sm bg-background/50 border-blue-500/20 focus:border-blue-500 transition-all duration-300"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Pacientes */}
          {filteredClients.length === 0 ? (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="inline-block p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full mb-4">
                    <Heart className="h-16 w-16 text-blue-500" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente vinculado'}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {searchTerm 
                      ? 'Tente ajustar os termos de pesquisa.'
                      : 'Entre em contato com a coordenação para vincular pacientes.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filteredClients.map((client, index) => {
                const age = calculateAge(client.birth_date);
                const daysSince = daysSinceLastSession(client.last_session_date);
                const isMinor = age !== null && age < 18;
                const sessions = sessionCounts.get(client.id) || 0;
                const nextAppt = nextAppointmentByClient.get(client.id);
                
                const unitConfig = {
                  madre: { 
                    gradient: 'from-blue-500 to-blue-600', 
                    bg: 'bg-blue-50 dark:bg-blue-950/30',
                    text: 'text-blue-700 dark:text-blue-300',
                    icon: '🏥'
                  },
                  floresta: { 
                    gradient: 'from-emerald-500 to-emerald-600', 
                    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                    text: 'text-emerald-700 dark:text-emerald-300',
                    icon: '🌳'
                  },
                  atendimento_floresta: { 
                    gradient: 'from-teal-500 to-teal-600', 
                    bg: 'bg-teal-50 dark:bg-teal-950/30',
                    text: 'text-teal-700 dark:text-teal-300',
                    icon: '🌿'
                  }
                };
                const config = unitConfig[client.unit as keyof typeof unitConfig] || unitConfig.madre;

                return (
                  <Card 
                    key={client.id} 
                    className="group relative overflow-hidden border shadow-sm hover:shadow-lg transition-shadow duration-200 bg-card"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />
                    
                    <CardHeader className="pb-3 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-foreground truncate uppercase">
                             {client.name}
                           </CardTitle>
                          {age !== null && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {age} anos {isMinor && <span className="text-amber-600 dark:text-amber-400">(Menor)</span>}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant="outline"
                          className={`shrink-0 text-xs font-medium ${config.bg} ${config.text} border-0`}
                        >
                          {config.icon} {client.unit === 'madre' ? 'Madre' : 
                              client.unit === 'floresta' ? 'Floresta' :
                              client.unit === 'atendimento_floresta' ? 'Atend.' :
                              'N/A'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-2.5 pb-4">
                      {/* Telefone */}
                      {(client.phone || client.responsible_phone) && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-foreground truncate">
                            {isMinor && client.responsible_phone 
                              ? client.responsible_phone 
                              : client.phone || 'Não informado'}
                          </span>
                        </div>
                      )}

                      {/* Responsável */}
                      {isMinor && client.responsible_name && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-foreground truncate">
                            Resp.: {client.responsible_name}
                          </span>
                        </div>
                      )}

                      {/* Sessões realizadas */}
                      <div className="flex items-center gap-2.5 text-sm">
                        <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground">
                          {sessions} {sessions === 1 ? 'sessão realizada' : 'sessões realizadas'}
                        </span>
                      </div>

                      {/* Última sessão */}
                      {client.last_session_date && daysSince !== null && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className={daysSince > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
                            Última sessão: {daysSince} dia{daysSince !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Indicador de status/próximo agendamento */}
                      {nextAppt ? (
                        <div className="flex items-center gap-2.5 text-sm">
                          <CalendarIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                            Próx: {format(nextAppt, "dd/MM 'às' HH:mm")}
                          </span>
                        </div>
                      ) : daysSince && daysSince > 30 ? (
                        <div className="flex items-center gap-2.5 text-sm">
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="text-amber-600 dark:text-amber-400 text-xs">
                            Sem agendamento próximo
                          </span>
                        </div>
                      ) : null}

                      {/* Botões */}
                      <div className="flex gap-2 pt-3 border-t border-border/50">
                        <Button 
                          size="sm" 
                          onClick={() => openPatientModal(client.id)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            window.location.href = `/schedule?client=${client.id}`;
                          }}
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>

      {/* Diálogo de finalizar atendimento */}
      <CompleteAttendanceDialog
        schedule={completeSchedule}
        isOpen={!!completeSchedule}
        onClose={() => setCompleteSchedule(null)}
        onComplete={() => {
          setCompleteSchedule(null);
          loadMySchedules();
          loadStats();
        }}
      />

      {/* Modal de detalhes do paciente */}
      <PatientDetailsModal
        clientId={patientModalClientId}
        open={patientModalOpen}
        onOpenChange={setPatientModalOpen}
      />
    </div>
  );
};

export default MyPatients;
