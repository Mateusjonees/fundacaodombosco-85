import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import CompleteAttendanceDialog from '@/components/CompleteAttendanceDialog';
import PersonalTaskDialog, { TaskData } from '@/components/PersonalTaskDialog';
import PersonalEventDialog, { EventData } from '@/components/PersonalEventDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientDetailsModal } from '@/components/PatientDetailsModal';
import { StatsCard } from '@/components/ui/stats-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Heart, Search, Calendar as CalendarIcon, Phone, User, Clock,
  AlertCircle, ChevronLeft, ChevronRight, CheckCircle, Eye,
  CalendarCheck, TrendingUp, Activity, Plus, ListTodo, CalendarDays,
  MoreHorizontal, Pencil, Trash2, CheckSquare, Circle
} from 'lucide-react';
import {
  format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isSameDay, addMonths, subMonths, addWeeks, subWeeks, eachDayOfInterval,
  getDay, setHours, setMinutes, differenceInMinutes, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface Client {
  id: string; name: string; birth_date?: string; phone?: string;
  address?: string; unit?: string; responsible_name?: string;
  responsible_phone?: string; is_active: boolean;
  last_session_date?: string; created_at: string;
}

interface Schedule {
  id: string; client_id: string; employee_id: string;
  start_time: string; end_time: string; title: string;
  status: string; notes?: string; clients?: { name: string };
}

interface ProfessionalTask {
  id: string; user_id: string; title: string; description?: string;
  due_date?: string; due_time?: string; color: string;
  status: string; priority: string; client_id?: string;
  created_at: string; updated_at: string;
}

interface PersonalEvent {
  id: string; user_id: string; title: string; description?: string;
  start_time: string; end_time: string; color: string;
  is_all_day: boolean; created_at: string;
}

type ViewMode = 'day' | 'week' | 'month';
type ActiveTab = 'calendar' | 'patients';

// Horas de trabalho para a grade
const WORK_HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h - 20h

const MyPatients: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const permissions = useRolePermissions();
  const [clients, setClients] = useState<Client[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [tasks, setTasks] = useState<ProfessionalTask[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [completeSchedule, setCompleteSchedule] = useState<Schedule | null>(null);
  const [patientModalClientId, setPatientModalClientId] = useState<string | null>(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);

  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [dialogDefaultDate, setDialogDefaultDate] = useState<Date>(new Date());

  // Stats
  const [weekAppointments, setWeekAppointments] = useState(0);
  const [monthCompleted, setMonthCompleted] = useState(0);
  const [nextAppointment, setNextAppointment] = useState<string | null>(null);

  const loadAll = useCallback(() => {
    if (!user) return;
    loadMyPatients();
    loadMySchedules();
    loadTasks();
    loadPersonalEvents();
    loadStats();
  }, [user, selectedDate, viewMode]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadStats = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { count: weekCount } = await supabase
        .from('schedules').select('*', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .in('status', ['scheduled', 'confirmed', 'completed']);
      setWeekAppointments(weekCount || 0);

      const { count: monthCount } = await supabase
        .from('schedules').select('*', { count: 'exact', head: true })
        .eq('employee_id', user.id).eq('status', 'completed')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString());
      setMonthCompleted(monthCount || 0);

      const { data: nextData } = await supabase
        .from('schedules').select('start_time, clients(name)')
        .eq('employee_id', user.id).in('status', ['scheduled', 'confirmed'])
        .gte('start_time', now.toISOString())
        .order('start_time', { ascending: true }).limit(1);

      if (nextData?.length) {
        const n = nextData[0];
        setNextAppointment(`${format(new Date(n.start_time), 'HH:mm')} - ${(n.clients as any)?.name || 'Paciente'}`);
      } else {
        setNextAppointment(null);
      }
    } catch (error) { console.error('Error loading stats:', error); }
  };

  const loadMySchedules = async () => {
    if (!user) return;
    try {
      let rangeStart: Date, rangeEnd: Date;
      if (viewMode === 'day') {
        rangeStart = new Date(selectedDate); rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(selectedDate); rangeEnd.setHours(23, 59, 59, 999);
      } else if (viewMode === 'month') {
        rangeStart = startOfMonth(selectedDate); rangeEnd = endOfMonth(selectedDate);
      } else {
        rangeStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        rangeEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      }

      const { data: assignedClients } = await supabase
        .from('client_assignments').select('client_id')
        .eq('employee_id', user.id).eq('is_active', true);

      if (!assignedClients?.length) { setSchedules([]); return; }

      const clientIds = assignedClients.map(a => a.client_id);
      const { data, error } = await supabase
        .from('schedules')
        .select('id, client_id, employee_id, start_time, end_time, title, status, notes, clients(name)')
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .in('client_id', clientIds)
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) { console.error('Error loading schedules:', error); }
  };

  const loadTasks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('professional_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) { console.error('Error loading tasks:', error); }
  };

  const loadPersonalEvents = async () => {
    if (!user) return;
    try {
      let rangeStart: Date, rangeEnd: Date;
      if (viewMode === 'day') {
        rangeStart = new Date(selectedDate); rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(selectedDate); rangeEnd.setHours(23, 59, 59, 999);
      } else if (viewMode === 'month') {
        rangeStart = startOfMonth(selectedDate); rangeEnd = endOfMonth(selectedDate);
      } else {
        rangeStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        rangeEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      }
      const { data, error } = await supabase
        .from('personal_events').select('*')
        .eq('user_id', user.id)
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .order('start_time');
      if (error) throw error;
      setPersonalEvents(data || []);
    } catch (error) { console.error('Error loading events:', error); }
  };

  const loadMyPatients = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_assignments')
        .select('client_id, clients(id, name, birth_date, phone, address, unit, responsible_name, responsible_phone, is_active, last_session_date, created_at)')
        .eq('employee_id', user.id).eq('is_active', true).eq('clients.is_active', true);
      if (error) throw error;
      const clientsData = (data || []).filter(a => a.clients).map(a => a.clients).filter(Boolean) as Client[];
      setClients(clientsData);
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Erro ao carregar pacientes' });
    } finally { setLoading(false); }
  };

  const toggleTaskStatus = async (task: ProfessionalTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await supabase.from('professional_tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', task.id);
    loadTasks();
  };

  // Navigation
  const navigatePeriod = (dir: 'prev' | 'next') => {
    if (viewMode === 'day') setSelectedDate(d => dir === 'prev' ? subDays(d, 1) : addDays(d, 1));
    else if (viewMode === 'week') setSelectedDate(d => dir === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1));
    else setSelectedDate(d => dir === 'prev' ? subMonths(d, 1) : addMonths(d, 1));
  };

  const goToToday = () => setSelectedDate(new Date());

  const getPeriodLabel = () => {
    if (viewMode === 'day') return format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
    if (viewMode === 'month') return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
    const ws = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return `${format(ws, "dd MMM", { locale: ptBR })} – ${format(addDays(ws, 6), "dd MMM yyyy", { locale: ptBR })}`;
  };

  // Helpers
  const getDaySchedules = (date: Date) => schedules.filter(s => isSameDay(new Date(s.start_time), date));
  const getDayEvents = (date: Date) => personalEvents.filter(e => isSameDay(new Date(e.start_time), date));
  const getDayTasks = (date: Date) => tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), date));

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = { scheduled: 'Agendado', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Faltou' };
    return map[s] || s;
  };

  const getStatusDot = (s: string) => {
    const map: Record<string, string> = { scheduled: 'bg-blue-400', confirmed: 'bg-emerald-400', completed: 'bg-green-600', cancelled: 'bg-red-400', no_show: 'bg-orange-400' };
    return map[s] || 'bg-muted-foreground';
  };

  const openNewTask = (date?: Date) => {
    setEditingTask(null);
    setDialogDefaultDate(date || selectedDate);
    setTaskDialogOpen(true);
  };

  const openEditTask = (task: ProfessionalTask) => {
    setEditingTask({
      id: task.id, title: task.title, description: task.description || '',
      due_date: task.due_date || '', due_time: task.due_time || '',
      color: task.color, priority: task.priority, status: task.status,
      client_id: task.client_id || null,
    });
    setTaskDialogOpen(true);
  };

  const openNewEvent = (date?: Date) => {
    setEditingEvent(null);
    setDialogDefaultDate(date || selectedDate);
    setEventDialogOpen(true);
  };

  const openEditEvent = (ev: PersonalEvent) => {
    const d = new Date(ev.start_time);
    setEditingEvent({
      id: ev.id, title: ev.title, description: ev.description || '',
      date: format(d, 'yyyy-MM-dd'), start_time: format(d, 'HH:mm'),
      end_time: format(new Date(ev.end_time), 'HH:mm'), color: ev.color,
      is_all_day: ev.is_all_day,
    });
    setEventDialogOpen(true);
  };

  const clientsForSelect = useMemo(() => clients.map(c => ({ id: c.id, name: c.name })), [clients]);
  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  // ======= RENDER =======

  // Schedule event pill for calendar
  const SchedulePill = ({ schedule, compact }: { schedule: Schedule; compact?: boolean }) => (
    <button
      onClick={(e) => { e.stopPropagation(); if (['scheduled', 'confirmed'].includes(schedule.status)) setCompleteSchedule(schedule); }}
      className={`w-full text-left rounded-md px-2 py-1 text-[11px] leading-tight border-l-[3px] transition-all hover:opacity-80 ${
        schedule.status === 'completed' ? 'bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 line-through opacity-60'
        : schedule.status === 'cancelled' ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 opacity-50'
        : 'bg-blue-500/10 border-blue-500 text-foreground cursor-pointer hover:bg-blue-500/20'
      }`}
    >
      <div className="flex items-center gap-1">
        <span className="font-semibold">{format(new Date(schedule.start_time), 'HH:mm')}</span>
        {!compact && <span className="truncate">- {schedule.clients?.name || schedule.title}</span>}
      </div>
      {compact && <div className="truncate font-medium">{schedule.clients?.name || schedule.title}</div>}
    </button>
  );

  // Task pill
  const TaskPill = ({ task, compact }: { task: ProfessionalTask; compact?: boolean }) => (
    <button
      onClick={(e) => { e.stopPropagation(); openEditTask(task); }}
      className={`w-full text-left rounded-md px-2 py-1 text-[11px] leading-tight border-l-[3px] transition-all hover:opacity-80 ${
        task.status === 'completed' ? 'opacity-50 line-through' : ''
      }`}
      style={{ borderLeftColor: task.color, backgroundColor: `${task.color}15` }}
    >
      <div className="flex items-center gap-1">
        {task.status === 'completed' ? <CheckSquare className="h-3 w-3 shrink-0" /> : <Circle className="h-3 w-3 shrink-0" />}
        <span className="truncate font-medium">{task.title}</span>
      </div>
    </button>
  );

  // Event pill
  const EventPill = ({ event, compact }: { event: PersonalEvent; compact?: boolean }) => (
    <button
      onClick={(e) => { e.stopPropagation(); openEditEvent(event); }}
      className="w-full text-left rounded-md px-2 py-1 text-[11px] leading-tight border-l-[3px] transition-all hover:opacity-80"
      style={{ borderLeftColor: event.color, backgroundColor: `${event.color}15` }}
    >
      <div className="flex items-center gap-1">
        <CalendarDays className="h-3 w-3 shrink-0" style={{ color: event.color }} />
        <span className="truncate font-medium">
          {!event.is_all_day && format(new Date(event.start_time), 'HH:mm') + ' '}
          {event.title}
        </span>
      </div>
    </button>
  );

  // ====== DAY VIEW - Time grid style ======
  const DayView = () => {
    const dayScheds = getDaySchedules(selectedDate);
    const dayEvents = getDayEvents(selectedDate);
    const dayTasks = getDayTasks(selectedDate);

    return (
      <div className="border rounded-xl overflow-hidden bg-card">
        {/* All day / tasks section */}
        {(dayTasks.length > 0 || dayEvents.filter(e => e.is_all_day).length > 0) && (
          <div className="border-b px-3 py-2 bg-muted/30 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Dia inteiro / Tarefas</span>
            {dayTasks.map(t => <TaskPill key={t.id} task={t} />)}
            {dayEvents.filter(e => e.is_all_day).map(e => <EventPill key={e.id} event={e} />)}
          </div>
        )}
        {/* Time grid */}
        <div className="divide-y">
          {WORK_HOURS.map(hour => {
            const hourScheds = dayScheds.filter(s => new Date(s.start_time).getHours() === hour);
            const hourEvents = dayEvents.filter(e => !e.is_all_day && new Date(e.start_time).getHours() === hour);

            return (
              <div
                key={hour}
                className="flex min-h-[52px] hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => openNewEvent(setHours(setMinutes(selectedDate, 0), hour))}
              >
                <div className="w-16 shrink-0 flex items-start justify-end pr-3 pt-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium">{String(hour).padStart(2, '0')}:00</span>
                </div>
                <div className="flex-1 border-l px-2 py-1 space-y-1 relative">
                  {hourScheds.map(s => <SchedulePill key={s.id} schedule={s} />)}
                  {hourEvents.map(e => <EventPill key={e.id} event={e} />)}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ====== WEEK VIEW - Google Calendar style ======
  const WeekView = () => {
    const ws = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: ws, end: addDays(ws, 6) });

    return (
      <div className="border rounded-xl overflow-hidden bg-card">
        {/* Day headers */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b bg-muted/30">
          <div className="p-2" />
          {days.map(day => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`text-center py-2 border-l cursor-pointer hover:bg-muted/50 transition-colors ${isToday ? 'bg-primary/5' : ''}`}
                onClick={() => { setSelectedDate(day); setViewMode('day'); }}
              >
                <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <ScrollArea className="h-[520px]">
          <div className="relative">
            {WORK_HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[56px_repeat(7,1fr)] border-b min-h-[48px]">
                <div className="flex items-start justify-end pr-2 pt-0.5">
                  <span className="text-[10px] text-muted-foreground">{String(hour).padStart(2, '0')}:00</span>
                </div>
                {days.map(day => {
                  const dayScheds = getDaySchedules(day).filter(s => new Date(s.start_time).getHours() === hour);
                  const dayEvts = getDayEvents(day).filter(e => !e.is_all_day && new Date(e.start_time).getHours() === hour);
                  const dayTks = hour === 7 ? getDayTasks(day) : []; // Tasks at top of day

                  return (
                    <div
                      key={day.toISOString()}
                      className="border-l px-0.5 py-0.5 space-y-0.5 hover:bg-muted/10 cursor-pointer transition-colors"
                      onClick={() => openNewEvent(setHours(setMinutes(day, 0), hour))}
                    >
                      {dayTks.map(t => <TaskPill key={t.id} task={t} compact />)}
                      {dayScheds.map(s => <SchedulePill key={s.id} schedule={s} compact />)}
                      {dayEvts.map(e => <EventPill key={e.id} event={e} compact />)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // ====== MONTH VIEW ======
  const MonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

    return (
      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="grid grid-cols-7 bg-muted/30 border-b">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="text-center py-2 text-[11px] font-semibold text-muted-foreground uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {allDays.map(day => {
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            const dayScheds = getDaySchedules(day);
            const dayTks = getDayTasks(day);
            const dayEvts = getDayEvents(day);
            const totalItems = dayScheds.length + dayTks.length + dayEvts.length;

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] border-b border-r p-1 cursor-pointer hover:bg-muted/20 transition-colors ${
                  !isCurrentMonth ? 'opacity-40' : ''
                } ${isToday ? 'bg-primary/5' : ''}`}
                onClick={() => { setSelectedDate(day); setViewMode('day'); }}
              >
                <div className={`text-xs font-bold mb-1 ${
                  isToday ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : 'text-foreground'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayScheds.slice(0, 2).map(s => <SchedulePill key={s.id} schedule={s} compact />)}
                  {dayTks.slice(0, 1).map(t => <TaskPill key={t.id} task={t} compact />)}
                  {dayEvts.slice(0, 1).map(e => <EventPill key={e.id} event={e} compact />)}
                  {totalItems > 3 && (
                    <div className="text-[10px] text-primary font-medium px-1">+{totalItems - 3} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ====== TASKS SIDEBAR ======
  const TasksSidebar = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <ListTodo className="h-4 w-4 text-primary" />
          Minhas Tarefas
        </h3>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openNewTask()}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nova
        </Button>
      </div>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
        {pendingTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma tarefa pendente</p>
        ) : (
          pendingTasks.map(task => (
            <div
              key={task.id}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <button
                onClick={() => toggleTaskStatus(task)}
                className="mt-0.5 shrink-0"
              >
                <div
                  className="h-4 w-4 rounded border-2 flex items-center justify-center transition-colors hover:opacity-70"
                  style={{ borderColor: task.color }}
                >
                  {task.status === 'completed' && <CheckCircle className="h-3 w-3" style={{ color: task.color }} />}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium leading-tight ${task.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                  {task.title}
                </p>
                {task.due_date && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(parseISO(task.due_date), "dd/MM")}
                    {task.due_time && ` às ${task.due_time.slice(0, 5)}`}
                  </p>
                )}
                {task.priority === 'high' && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0 mt-0.5">Alta</Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditTask(task)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleTaskStatus(task)}>
                    <CheckSquare className="h-3.5 w-3.5 mr-2" /> {task.status === 'completed' ? 'Reabrir' : 'Concluir'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={async () => {
                      await supabase.from('professional_tasks').delete().eq('id', task.id);
                      loadTasks();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full p-3 sm:p-6 space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="relative pl-3">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary to-primary/50 rounded-full" />
          <h1 className="text-xl sm:text-3xl font-extrabold text-foreground">Meus Pacientes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Agenda pessoal, tarefas e pacientes</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openNewTask()}>
                <ListTodo className="h-4 w-4 mr-2" /> Nova Tarefa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openNewEvent()}>
                <CalendarDays className="h-4 w-4 mr-2" /> Novo Evento Pessoal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Badge className="text-sm px-3 py-1.5 shrink-0 bg-primary/10 text-primary border-primary/20">
            <Heart className="h-3.5 w-3.5 mr-1" />
            {clients.length}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Pacientes" value={clients.length} icon={<Heart className="h-5 w-5" />} variant="blue" />
        <StatsCard title="Atend. Semana" value={weekAppointments} icon={<CalendarCheck className="h-5 w-5" />} variant="green" />
        <StatsCard title="Concluídos/Mês" value={monthCompleted} icon={<TrendingUp className="h-5 w-5" />} variant="purple" />
        <StatsCard title="Próximo" value={nextAppointment ? '' : '—'} subtitle={nextAppointment || 'Sem agenda'} icon={<Activity className="h-5 w-5" />} variant="orange" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as ActiveTab)}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="calendar" className="gap-1.5 text-xs">
            <CalendarIcon className="h-3.5 w-3.5" /> Agenda
          </TabsTrigger>
          <TabsTrigger value="patients" className="gap-1.5 text-xs">
            <Heart className="h-3.5 w-3.5" /> Pacientes
          </TabsTrigger>
        </TabsList>

        {/* ===== CALENDAR TAB ===== */}
        <TabsContent value="calendar" className="mt-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Calendar */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')} className="h-8 w-8 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')} className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-3 text-xs">
                    Hoje
                  </Button>
                  <h2 className="text-sm sm:text-base font-semibold capitalize ml-1">{getPeriodLabel()}</h2>
                </div>
                <div className="flex items-center bg-muted rounded-lg p-0.5">
                  {(['day', 'week', 'month'] as ViewMode[]).map(m => (
                    <Button
                      key={m}
                      size="sm"
                      variant={viewMode === m ? 'default' : 'ghost'}
                      onClick={() => setViewMode(m)}
                      className="h-7 px-3 text-xs"
                    >
                      {m === 'day' ? 'Dia' : m === 'week' ? 'Semana' : 'Mês'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Calendar content */}
              {viewMode === 'day' && <DayView />}
              {viewMode === 'week' && <WeekView />}
              {viewMode === 'month' && <MonthView />}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-blue-500" /> Atendimentos</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-violet-500" /> Eventos pessoais</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-amber-500" /> Tarefas</div>
              </div>
            </div>

            {/* Sidebar - Tasks */}
            <div className="lg:w-64 shrink-0">
              <Card className="border bg-card/50">
                <CardContent className="p-3">
                  <TasksSidebar />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ===== PATIENTS TAB ===== */}
        <TabsContent value="patients" className="mt-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar paciente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-sm"
            />
          </div>

          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold text-lg text-foreground">{searchTerm ? 'Nenhum encontrado' : 'Nenhum paciente vinculado'}</h3>
              <p className="text-sm text-muted-foreground mt-1">{searchTerm ? 'Ajuste a pesquisa' : 'Fale com a coordenação'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredClients.map(client => {
                const age = client.birth_date ? (() => {
                  const today = new Date(); const birth = new Date(client.birth_date!);
                  let a = today.getFullYear() - birth.getFullYear();
                  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) a--;
                  return a;
                })() : null;
                const unitMap: Record<string, { color: string; label: string }> = {
                  madre: { color: 'bg-blue-500', label: 'Madre' },
                  floresta: { color: 'bg-emerald-500', label: 'Floresta' },
                  atendimento_floresta: { color: 'bg-teal-500', label: 'Atend.' },
                };
                const unit = unitMap[client.unit || ''] || { color: 'bg-muted-foreground', label: 'N/A' };

                return (
                  <Card key={client.id} className="group border hover:shadow-md transition-shadow">
                    <div className={`h-1 ${unit.color}`} />
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm uppercase truncate">{client.name}</h4>
                          {age !== null && <p className="text-xs text-muted-foreground">{age} anos</p>}
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">{unit.label}</Badge>
                      </div>
                      {(client.phone || client.responsible_phone) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="truncate">{client.phone || client.responsible_phone}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => { setPatientModalClientId(client.id); setPatientModalOpen(true); }}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => window.location.href = `/schedule?client=${client.id}`}>
                          <CalendarIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CompleteAttendanceDialog
        schedule={completeSchedule}
        isOpen={!!completeSchedule}
        onClose={() => setCompleteSchedule(null)}
        onComplete={() => { setCompleteSchedule(null); loadAll(); }}
      />
      <PersonalTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        defaultDate={dialogDefaultDate}
        clients={clientsForSelect}
        onSaved={() => { loadTasks(); }}
      />
      <PersonalEventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={editingEvent}
        defaultDate={dialogDefaultDate}
        onSaved={() => { loadPersonalEvents(); }}
      />
      <PatientDetailsModal
        clientId={patientModalClientId}
        open={patientModalOpen}
        onOpenChange={setPatientModalOpen}
      />
    </div>
  );
};

export default MyPatients;
