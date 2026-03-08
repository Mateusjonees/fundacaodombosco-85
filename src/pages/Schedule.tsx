import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar as CalendarIcon, Clock, Search, X, CalendarDays, LayoutList, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScheduleAlerts } from '@/components/ScheduleAlerts';
import { CancelAppointmentDialog } from '@/components/CancelAppointmentDialog';
import { DeleteAppointmentDialog } from '@/components/DeleteAppointmentDialog';
import CompleteAttendanceDialog from '@/components/CompleteAttendanceDialog';
import PatientArrivedNotification from '@/components/PatientArrivedNotification';
import { ScheduleCard } from '@/components/ScheduleCard';
import { CreateScheduleDialog } from '@/components/schedule/CreateScheduleDialog';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEmployees } from '@/hooks/useEmployees';
import { useClients } from '@/hooks/useClients';
import { useSchedules } from '@/hooks/useSchedules';

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
  arrived_at?: string;
  arrived_confirmed_by?: string;
  clients?: { name: string };
  profiles?: { name: string };
}

export default function SchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScheduleForAction, setSelectedScheduleForAction] = useState<Schedule | null>(null);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  // Filtros
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [filterTimeStart, setFilterTimeStart] = useState('');
  const [filterTimeEnd, setFilterTimeEnd] = useState('');

  // React Query hooks
  const { data: userProfile, isLoading: loadingProfile } = useUserProfile(user?.id);
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees(userProfile);
  const { data: clients = [], isLoading: loadingClients } = useClients({ isActive: true });
  const { data: schedules = [], isLoading: loadingSchedules, refetch: refetchSchedules } = useSchedules(
    selectedDate, userProfile, { employeeId: filterEmployee !== 'all' ? filterEmployee : undefined, viewMode }
  );

  const userRole = userProfile?.employee_role;
  const isAdmin = useMemo(() => ['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist'].includes(userRole || ''), [userRole]);
  const canCancelSchedules = isAdmin;
  const canDeleteSchedules = useMemo(() => ['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta'].includes(userRole || ''), [userRole]);

  const loading = loadingProfile || loadingEmployees || loadingClients || loadingSchedules;

  // URL params for pre-filling
  useEffect(() => {
    if (!userProfile) return;
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id') || urlParams.get('client');
    if (clientId) {
      setEditingSchedule(null);
      setIsDialogOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [userProfile]);

  // Handlers (memoized)
  const handleEditSchedule = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsDialogOpen(true);
  }, []);

  const handleRedirect = useCallback(async (scheduleId: string, newEmployeeId: string) => {
    try {
      const { error } = await supabase.from('schedules').update({ employee_id: newEmployeeId }).eq('id', scheduleId);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Agendamento redirecionado!' });
      refetchSchedules();
    } catch { toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao redirecionar.' }); }
  }, [toast, refetchSchedules]);

  const handleCancelAppointment = useCallback(async (scheduleId: string, reason?: string, category?: string) => {
    try {
      const note = category ? `[${category}] ${reason || 'Cancelado'}` : (reason ? `Cancelado: ${reason}` : 'Cancelado');
      const { error } = await supabase.from('schedules').update({ status: 'cancelled', notes: note }).eq('id', scheduleId);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Agendamento cancelado!' });
      refetchSchedules();
    } catch { toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao cancelar.' }); }
  }, [toast, refetchSchedules]);

  const handleCancelMultiple = useCallback(async (ids: string[], reason: string, category: string) => {
    try {
      const { error } = await supabase.from('schedules').update({ status: 'cancelled', notes: `[${category}] ${reason}` }).in('id', ids);
      if (error) throw error;
      toast({ title: 'Sucesso', description: `${ids.length} cancelado(s)!` });
      refetchSchedules();
    } catch { toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao cancelar.' }); }
  }, [toast, refetchSchedules]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Excluído!' });
      refetchSchedules();
    } catch { toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao excluir.' }); }
  }, [toast, refetchSchedules]);

  const handleDeleteMultiple = useCallback(async (ids: string[]) => {
    try {
      const { error } = await supabase.from('schedules').delete().in('id', ids);
      if (error) throw error;
      toast({ title: 'Sucesso', description: `${ids.length} excluído(s)!` });
      refetchSchedules();
    } catch { toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao excluir.' }); }
  }, [toast, refetchSchedules]);

  const getStatusBadge = useCallback((status: string) => {
    const map: Record<string, any> = {
      'scheduled': { text: 'Agendado', variant: 'default', icon: CalendarIcon },
      'confirmed': { text: 'Confirmado', variant: 'secondary', icon: CheckCircle },
      'completed': { text: '✓ Concluído', variant: 'outline', icon: CheckCircle, className: 'border-green-500 text-green-700 bg-green-50 font-semibold' },
      'pending_validation': { text: '⏳ Aguardando', variant: 'outline', icon: Clock, className: 'border-amber-500 text-amber-700 bg-amber-50 font-semibold' },
      'cancelled': { text: 'Cancelado', variant: 'destructive', icon: XCircle },
    };
    return map[status] || { text: 'Desconhecido', variant: 'outline' as const };
  }, []);

  // Memoized filtering
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s: any) => {
      if (filterEmployee !== 'all' && s.employee_id !== filterEmployee) return false;
      if (filterUnit !== 'all' && s.unit !== filterUnit) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const fields = [s.clients?.name, employees.find((e: any) => e.user_id === s.employee_id)?.name, s.title, s.notes, s.unit, format(new Date(s.start_time), 'HH:mm'), format(new Date(s.start_time), 'dd/MM/yyyy')].join(' ').toLowerCase();
        if (!fields.includes(q)) return false;
      }
      if (filterTimeStart || filterTimeEnd) {
        const t = format(new Date(s.start_time), 'HH:mm');
        if (filterTimeStart && t < filterTimeStart) return false;
        if (filterTimeEnd && t > filterTimeEnd) return false;
      }
      return true;
    });
  }, [schedules, filterEmployee, filterUnit, searchText, filterTimeStart, filterTimeEnd, employees]);

  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const schedulesByDay = useMemo(() => weekDays.map(d => ({ date: d, schedules: filteredSchedules.filter((s: any) => isSameDay(new Date(s.start_time), d)) })), [weekDays, filteredSchedules]);

  const dayStats = useMemo(() => ({
    total: filteredSchedules.length,
    confirmed: filteredSchedules.filter((s: any) => s.status === 'confirmed' || s.patient_arrived).length,
    completed: filteredSchedules.filter((s: any) => s.status === 'completed').length,
  }), [filteredSchedules]);

  const scheduleCardProps = useCallback((schedule: any) => ({
    schedule,
    employees,
    userProfile,
    isAdmin,
    canCancelSchedules,
    canDeleteSchedules,
    onEdit: handleEditSchedule,
    onRedirect: handleRedirect,
    onCancelClick: () => { setSelectedScheduleForAction(schedule); setCancelDialogOpen(true); },
    onDeleteClick: () => { setSelectedScheduleForAction(schedule); setDeleteDialogOpen(true); },
    onCompleteClick: () => { setSelectedScheduleForAction(schedule); setCompleteDialogOpen(true); },
    onPresenceUpdate: refetchSchedules,
    getStatusBadge,
  }), [employees, userProfile, isAdmin, canCancelSchedules, canDeleteSchedules, handleEditSchedule, handleRedirect, refetchSchedules, getStatusBadge]);

  const isTodaySelected = isToday(selectedDate);

  return (
    <div className="w-full p-2 sm:p-4 space-y-4 animate-fade-in">
      <PatientArrivedNotification />
      <ScheduleAlerts />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground truncate">{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Botão Hoje */}
          {!isTodaySelected && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 text-xs h-9"
              onClick={() => setSelectedDate(new Date())}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Hoje
            </Button>
          )}
          <Button className="gap-2" onClick={() => { setEditingSchedule(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Agendamento</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar - escondido no mobile por padrão, toggle */}
        <div className="w-full lg:w-72 shrink-0 space-y-3">
          {/* Mobile toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full lg:hidden gap-2 text-xs"
            onClick={() => setShowSidebarMobile(!showSidebarMobile)}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {showSidebarMobile ? 'Ocultar Calendário' : 'Mostrar Calendário'}
          </Button>

          <div className={`space-y-3 ${showSidebarMobile ? 'block' : 'hidden lg:block'}`}>
            <Card className="border shadow-sm">
              <CardContent className="p-3 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="rounded-lg"
                  classNames={{
                    head_row: "flex w-full justify-between",
                    head_cell: "text-muted-foreground rounded-md flex-1 text-center font-normal text-[0.8rem]",
                    row: "flex w-full mt-2 justify-between",
                    cell: "h-9 flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  }}
                />
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="border shadow-sm">
                <CardContent className="p-3 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Profissional</Label>
                    <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                      <SelectTrigger className="h-8 mt-1 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {employees.map((emp: any) => <SelectItem key={emp.user_id} value={emp.user_id}>{emp.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {userRole === 'director' && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Unidade</Label>
                      <Select value={filterUnit} onValueChange={setFilterUnit}>
                        <SelectTrigger className="h-8 mt-1 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="madre">MADRE</SelectItem>
                          <SelectItem value="floresta">Floresta</SelectItem>
                          <SelectItem value="atendimento_floresta">Atend. Floresta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar paciente, profissional..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="pl-8 h-9 text-sm" />
              {searchText && (
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={() => setSearchText('')} aria-label="Limpar busca">
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'day' | 'week')}>
              <ToggleGroupItem value="day" aria-label="Visualização diária" className="gap-1 h-9 px-3 text-sm"><LayoutList className="h-4 w-4" />Dia</ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Visualização semanal" className="gap-1 h-9 px-3 text-sm"><CalendarDays className="h-4 w-4" />Semana</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Active filters */}
          {(searchText || filterEmployee !== 'all' || filterUnit !== 'all') && (
            <div className="flex flex-wrap items-center gap-1.5">
              {searchText && <Badge variant="secondary" className="gap-1 text-xs">"{searchText}" <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchText('')} /></Badge>}
              {filterEmployee !== 'all' && <Badge variant="secondary" className="gap-1 text-xs">{employees.find((e: any) => e.user_id === filterEmployee)?.name} <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterEmployee('all')} /></Badge>}
              {filterUnit !== 'all' && <Badge variant="secondary" className="gap-1 text-xs">{filterUnit === 'madre' ? 'MADRE' : filterUnit === 'floresta' ? 'Floresta' : 'Atend. Floresta'} <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterUnit('all')} /></Badge>}
            </div>
          )}

          {/* Day summary with status indicators */}
          <div className="flex items-center gap-3 text-sm px-1 flex-wrap">
            <span className="font-semibold text-foreground">{filteredSchedules.length} agendamento(s)</span>
            <span className="h-4 w-px bg-border" />
            {dayStats.confirmed > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {dayStats.confirmed} presente(s)
              </span>
            )}
            {dayStats.completed > 0 && (
              <span className="flex items-center gap-1.5 text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {dayStats.completed} concluído(s)
              </span>
            )}
            {filteredSchedules.filter((s: any) => s.status === 'cancelled').length > 0 && (
              <span className="flex items-center gap-1.5 text-destructive">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                {filteredSchedules.filter((s: any) => s.status === 'cancelled').length} cancelado(s)
              </span>
            )}
          </div>

          {/* Schedule list */}
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-16">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum agendamento {viewMode === 'day' ? 'para esta data' : 'nesta semana'}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Clique em "Novo Agendamento" para adicionar</p>
              {!isTodaySelected && (
                <Button variant="link" size="sm" className="mt-3 gap-1" onClick={() => setSelectedDate(new Date())}>
                  <RotateCcw className="h-3 w-3" />
                  Voltar para hoje
                </Button>
              )}
            </div>
          ) : viewMode === 'week' ? (
            <div className="space-y-4">
              {schedulesByDay.map(({ date, schedules: daySchedules }) => (
                <div key={date.toISOString()} className="space-y-2">
                  <div className={`flex items-center justify-between py-1.5 px-2 rounded-md text-sm ${isSameDay(date, new Date()) ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground'}`}>
                    <span>{format(date, "EEE, dd/MM", { locale: ptBR })}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{daySchedules.length}</Badge>
                  </div>
                  {daySchedules.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 pl-2">—</p>
                  ) : (
                    <div className="space-y-2 pl-1">
                      {daySchedules.map((schedule: any) => <ScheduleCard key={schedule.id} {...scheduleCardProps(schedule)} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSchedules.map((schedule: any) => <ScheduleCard key={schedule.id} {...scheduleCardProps(schedule)} />)}
            </div>
          )}
        </div>

        {/* Dialogs */}
        <CreateScheduleDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingSchedule={editingSchedule}
          userProfile={userProfile}
          isAdmin={isAdmin}
          employees={employees}
          clients={clients}
          onSuccess={refetchSchedules}
          onReset={() => setEditingSchedule(null)}
        />

        <CompleteAttendanceDialog
          schedule={selectedScheduleForAction}
          isOpen={completeDialogOpen}
          onClose={() => setCompleteDialogOpen(false)}
          onComplete={refetchSchedules}
        />

        <CancelAppointmentDialog
          schedule={selectedScheduleForAction}
          isOpen={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          onCancel={handleCancelAppointment}
          onCancelMultiple={handleCancelMultiple}
        />

        <DeleteAppointmentDialog
          schedule={selectedScheduleForAction}
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onDelete={handleDelete}
          onDeleteMultiple={handleDeleteMultiple}
        />
      </div>

      {/* FAB */}
      <Button
        className="fixed bottom-20 md:bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-40 bg-gradient-to-r from-primary to-primary-glow hover:scale-110 transition-all duration-300 border-0"
        onClick={() => { setEditingSchedule(null); setIsDialogOpen(true); }}
        aria-label="Novo agendamento"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
