import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar as CalendarIcon, Clock, User, Edit, CheckCircle, XCircle, ArrowRightLeft, Filter, Users, Stethoscope, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduleAlerts } from '@/components/ScheduleAlerts';
import { CancelAppointmentDialog } from '@/components/CancelAppointmentDialog';
import CompleteAttendanceDialog from '@/components/CompleteAttendanceDialog';
import { PatientCommandAutocomplete } from '@/components/PatientCommandAutocomplete';
import { ProfessionalCommandAutocomplete } from '@/components/ProfessionalCommandAutocomplete';
import PatientPresenceButton from '@/components/PatientPresenceButton';
import PatientArrivedNotification from '@/components/PatientArrivedNotification';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEmployees } from '@/hooks/useEmployees';
import { useClients } from '@/hooks/useClients';
import { useSchedules, useCreateSchedule, useUpdateSchedule } from '@/hooks/useSchedules';

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

export default function Schedule() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedScheduleForAction, setSelectedScheduleForAction] = useState<Schedule | null>(null);
  const { toast } = useToast();

  // Filtros
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');

  // React Query hooks
  const { data: userProfile, isLoading: loadingProfile } = useUserProfile(user?.id);
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees(userProfile);
  const { data: clients = [], isLoading: loadingClients } = useClients({ isActive: true });
  const { data: schedules = [], isLoading: loadingSchedules, refetch: refetchSchedules } = useSchedules(
    selectedDate, 
    userProfile,
    {
      employeeId: filterEmployee !== 'all' ? filterEmployee : undefined,
    }
  );
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();

  const userRole = userProfile?.employee_role;
  const isAdmin = userRole === 'director' || 
                  userRole === 'coordinator_madre' || 
                  userRole === 'coordinator_floresta' ||
                  userRole === 'receptionist';

  const [newAppointment, setNewAppointment] = useState({
    client_id: '',
    employee_id: '',
    title: 'Consulta',
    start_time: '',
    end_time: '',
    notes: '',
    unit: 'madre',
    sessionCount: 1
  });

  // Auto-definir a unidade baseada no funcionário logado
  useEffect(() => {
    if (userProfile) {
      // Priorizar a unidade definida no perfil do usuário
      let defaultUnit = userProfile.unit || 'madre';
      
      // Fallback baseado no cargo se não houver unidade definida
      if (!userProfile.unit) {
        if (userProfile.employee_role === 'coordinator_floresta') {
          defaultUnit = 'floresta';
        } else if (userProfile.employee_role === 'coordinator_madre') {
          defaultUnit = 'madre';
        }
      }
      
      setNewAppointment(prev => ({
        ...prev,
        unit: defaultUnit
      }));
    }
  }, [userProfile]);

  useEffect(() => {
    // Verificar se há parâmetros na URL para pré-preencher o formulário
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id') || urlParams.get('client');
    
    if (clientId) {
      setNewAppointment(prev => ({
        ...prev,
        client_id: clientId
      }));
      setIsDialogOpen(true);
    }
  }, []);

  // Auto-selecionar o profissional para usuários não-administrativos
  useEffect(() => {
    if (userProfile && !isAdmin) {
      setNewAppointment(prev => ({
        ...prev,
        employee_id: userProfile.id
      }));
    }
  }, [userProfile, isAdmin]);

  // Loading state
  const loading = loadingProfile || loadingEmployees || loadingClients || loadingSchedules;

  // Função para verificar sobreposição de horários
  const checkScheduleConflict = async (employeeId: string, startTime: string, endTime: string, excludeId?: string) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('id, start_time, end_time')
        .eq('employee_id', employeeId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('start_time', startTime.split('T')[0]) // Same day
        .lt('start_time', new Date(new Date(startTime).getTime() + 24*60*60*1000).toISOString().split('T')[0] + 'T23:59:59');
      
      if (error) throw error;
      
      return data?.some(schedule => {
        if (excludeId && schedule.id === excludeId) return false;
        
        const existingStart = new Date(schedule.start_time).getTime();
        const existingEnd = new Date(schedule.end_time).getTime();
        const newStart = new Date(startTime).getTime();
        const newEnd = new Date(endTime).getTime();
        
        // Verificar sobreposição
        return (newStart < existingEnd && newEnd > existingStart);
      }) || false;
    } catch (error) {
      console.error('Error checking schedule conflict:', error);
      return false;
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const convertToISOString = (dateTimeLocal: string) => {
        if (!dateTimeLocal) return '';
        const date = new Date(dateTimeLocal);
        return date.toISOString();
      };

      const appointmentData = {
        client_id: newAppointment.client_id,
        employee_id: newAppointment.employee_id,
        title: newAppointment.title,
        start_time: convertToISOString(newAppointment.start_time),
        end_time: convertToISOString(newAppointment.end_time),
        notes: newAppointment.notes,
        unit: newAppointment.unit,
        created_by: user?.id
      };

      if (editingSchedule) {
        const hasConflict = await checkScheduleConflict(
          appointmentData.employee_id,
          appointmentData.start_time,
          appointmentData.end_time,
          editingSchedule.id
        );
        
        if (hasConflict) {
          toast({
            variant: "destructive",
            title: "Conflito de Horário",
            description: "O profissional já possui um agendamento neste horário.",
          });
          return;
        }

        await updateSchedule.mutateAsync({
          id: editingSchedule.id,
          data: appointmentData
        });
        
        toast({
          title: "Sucesso",
          description: "Agendamento atualizado com sucesso!",
        });
      } else {
        const sessionCount = newAppointment.sessionCount || 1;
        const appointmentsToCreate = [];
        let conflictFound = false;
        
        for (let i = 0; i < sessionCount; i++) {
          const sessionDate = new Date(appointmentData.start_time);
          const sessionEndDate = new Date(appointmentData.end_time);
          
          sessionDate.setDate(sessionDate.getDate() + (i * 7));
          sessionEndDate.setDate(sessionEndDate.getDate() + (i * 7));
          
          const sessionStartTime = sessionDate.toISOString();
          const sessionEndTime = sessionEndDate.toISOString();
          
          const hasConflict = await checkScheduleConflict(
            appointmentData.employee_id,
            sessionStartTime,
            sessionEndTime
          );
          
          if (hasConflict) {
            toast({
              variant: "destructive",
              title: "Conflito de Horário",
              description: `Conflito encontrado na sessão ${i + 1} (${format(sessionDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}). O profissional já possui um agendamento neste horário.`,
            });
            conflictFound = true;
            break;
          }
          
          appointmentsToCreate.push({
            ...appointmentData,
            start_time: sessionStartTime,
            end_time: sessionEndTime,
            status: 'scheduled',
            notes: sessionCount > 1 
              ? `${appointmentData.notes} (Sessão ${i + 1} de ${sessionCount})` 
              : appointmentData.notes
          });
        }
        
        if (conflictFound) return;

        const { error } = await supabase
          .from('schedules')
          .insert(appointmentsToCreate);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: sessionCount > 1 
            ? `${sessionCount} sessões criadas com sucesso!`
            : "Agendamento criado com sucesso!",
        });
      }
      
      setIsDialogOpen(false);
      setEditingSchedule(null);
      setNewAppointment({
        client_id: '',
        employee_id: '',
        title: 'Consulta',
        start_time: '',
        end_time: '',
        notes: '',
        unit: 'madre',
        sessionCount: 1
      });
      refetchSchedules();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar agendamento. Tente novamente.",
      });
    }
  };

  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setNewAppointment({
      client_id: schedule.client_id,
      employee_id: schedule.employee_id,
      title: schedule.title,
      start_time: formatDateTimeLocal(schedule.start_time),
      end_time: formatDateTimeLocal(schedule.end_time),
      notes: schedule.notes || '',
      unit: schedule.unit || 'madre',
      sessionCount: 1
    });
    setIsDialogOpen(true);
  };

  const handleRedirect = async (scheduleId: string, newEmployeeId: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ employee_id: newEmployeeId })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento redirecionado com sucesso!",
      });
      
      refetchSchedules();
    } catch (error) {
      console.error('Error redirecting appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao redirecionar agendamento.",
      });
    }
  };

  const handleCancelAppointment = async (scheduleId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ 
          status: 'cancelled',
          notes: reason ? `Cancelado: ${reason}` : 'Cancelado'
        })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento cancelado!",
      });
      
      refetchSchedules();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cancelar agendamento.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon?: any; className?: string }> = {
      'scheduled': { text: 'Agendado', variant: 'default', icon: CalendarIcon },
      'confirmed': { text: 'Confirmado', variant: 'secondary', icon: CheckCircle },
      'completed': { text: '✓ Concluído', variant: 'outline', icon: CheckCircle, className: 'border-green-500 text-green-700 bg-green-50 font-semibold' },
      'pending_validation': { text: '⏳ Aguardando Validação', variant: 'outline', icon: Clock, className: 'border-amber-500 text-amber-700 bg-amber-50 font-semibold' },
      'cancelled': { text: 'Cancelado', variant: 'destructive', icon: XCircle }
    };
    
    return statusMap[status] || { text: 'Desconhecido', variant: 'outline' as const };
  };

  // Filtrar agendamentos
  const todaySchedules = schedules.filter(schedule => {
    if (filterEmployee !== 'all' && schedule.employee_id !== filterEmployee) {
      return false;
    }

    if (filterUnit !== 'all' && schedule.unit !== filterUnit) {
      return false;
    }

    return true;
  });

  console.log('Today schedules:', todaySchedules); // Debug log
  console.log('User can see patient presence buttons:', userProfile?.employee_role === 'receptionist'); // Debug log

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PatientArrivedNotification />
      <ScheduleAlerts />
      
      {/* Cabeçalho principal */}
      <div className="animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 rounded-full" />
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
            Agenda de Atendimentos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus compromissos e visualize os horários disponíveis
          </p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar esquerda com calendário e controles */}
        <div className="lg:w-80">
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-blue-500/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent font-bold">
                    Calendário
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="rounded-lg border-blue-500/20 w-full pointer-events-auto"
                />
              </CardContent>
            </Card>

            {/* Botão Novo Agendamento - Versão Desktop */}
            <Button 
              className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" 
              onClick={() => {
                setEditingSchedule(null);
                // Para profissionais comuns, pré-selecionar eles mesmos
                const defaultEmployeeId = !isAdmin && employees.length === 1 ? employees[0].user_id : '';
                setNewAppointment({
                  client_id: '',
                  employee_id: defaultEmployeeId,
                  title: 'Consulta',
                  start_time: '',
                  end_time: '',
                  notes: '',
                  unit: 'madre',
                  sessionCount: 1
                });
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Agendamento
            </Button>

            {/* Filtros para Administradores */}
            {isAdmin && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-purple-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg">
                      <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent font-bold">
                      Filtros
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filtro de Funcionário */}
                  <div>
                    <Label htmlFor="filterEmployee">Profissional</Label>
                    <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                      <SelectTrigger>
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
                  </div>

                  {/* Filtro de Unidade - Apenas para Diretores */}
                  {userRole === 'director' && (
                    <div>
                      <Label htmlFor="filterUnit">Unidade</Label>
                      <Select value={filterUnit} onValueChange={setFilterUnit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as unidades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as unidades</SelectItem>
                          <SelectItem value="madre">MADRE (Clínica Social)</SelectItem>
                          <SelectItem value="floresta">Floresta (Neuroavaliação)</SelectItem>
                          <SelectItem value="atendimento_floresta">Atendimento Floresta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Info da unidade atual para Coordenadores e Recepcionistas */}
                  {(userRole === 'coordinator_madre' || userRole === 'coordinator_floresta' || userRole === 'receptionist') && (
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">Unidade Atual:</p>
                      <p className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                        🏥 {userRole === 'coordinator_madre' ? 'MADRE' : 
                         userRole === 'coordinator_floresta' ? 'FLORESTA' : 
                         userProfile?.unit === 'madre' ? 'MADRE' : 
                         userProfile?.unit === 'floresta' ? 'FLORESTA' :
                         userProfile?.unit === 'atendimento_floresta' ? 'ATENDIMENTO FLORESTA' :
                         'N/A'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1">
          <div className="space-y-6">
            {/* Lista de Agendamentos */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-green-500/5">
               <CardHeader className="border-b border-gradient-to-r from-transparent via-green-500/20 to-transparent">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent font-bold">
                      Agenda do Dia
                    </span>
                    <p className="text-sm font-normal text-muted-foreground mt-1">
                      {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="border-0 shadow-lg">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-10 w-32" />
                              <Skeleton className="h-6 w-20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <Skeleton className="h-16 w-full" />
                              <Skeleton className="h-16 w-full" />
                            </div>
                            <Skeleton className="h-12 w-full" />
                            <div className="flex justify-between">
                              <Skeleton className="h-8 w-24" />
                              <div className="flex gap-2">
                                <Skeleton className="h-9 w-20" />
                                <Skeleton className="h-9 w-24" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : todaySchedules.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-block p-6 bg-gradient-to-br from-gray-500/10 to-gray-600/10 rounded-full mb-4">
                      <CalendarIcon className="h-16 w-16 text-gray-400" />
                    </div>
                    <p className="text-xl font-bold bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
                      Nenhum agendamento para esta data
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Clique em "Novo Agendamento" para adicionar compromissos
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                     {todaySchedules.map((schedule) => (
                       <div 
                         key={schedule.id} 
                         className={`group relative overflow-hidden p-6 border rounded-xl gap-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
                           schedule.patient_arrived 
                             ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50/50 shadow-lg' 
                             : 'border-border hover:border-blue-500/30 bg-gradient-to-br from-card to-blue-500/5'
                         }`}
                       >
                         <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        {/* Header com horário e tipo */}
                        <div className="relative flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg">
                              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                                {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })} - {format(new Date(schedule.end_time), 'HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                            <Badge className="text-sm font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
                              {schedule.title}
                            </Badge>
                          </div>
                          <Badge 
                            variant={
                              schedule.unit === 'madre' ? 'default' : 
                              schedule.unit === 'floresta' ? 'secondary' :
                              'outline'
                            }
                            className={`text-sm font-semibold ${
                              schedule.unit === 'madre' 
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' 
                                : schedule.unit === 'floresta'
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                                : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
                            }`}
                          >
                            🏥 {schedule.unit === 'madre' ? 'MADRE' : 
                                schedule.unit === 'floresta' ? 'FLORESTA' :
                                schedule.unit === 'atendimento_floresta' ? 'ATEND. FLORESTA' :
                                schedule.unit || 'N/A'}
                          </Badge>
                        </div>

                        {/* Informações principais */}
                        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/5 to-transparent rounded-lg border border-green-500/10">
                              <div className="p-1.5 bg-green-500/10 rounded-md">
                                <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-muted-foreground">Paciente</span>
                                <span className="font-bold text-foreground">{schedule.clients?.name || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/5 to-transparent rounded-lg border border-blue-500/10">
                              <div className="p-1.5 bg-blue-500/10 rounded-md">
                                <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-muted-foreground">Profissional</span>
                                 <span className="font-bold text-foreground">
                                   {employees.find(emp => emp.user_id === schedule.employee_id)?.name || 'Não atribuído'}
                                 </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status e observações */}
                        <div className="relative flex flex-col gap-3">
                          {schedule.notes && (
                            <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                              <p className="text-sm">
                                <span className="font-bold text-yellow-700 dark:text-yellow-400">💭 Observações:</span>
                                <span className="ml-2 text-foreground">{schedule.notes}</span>
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions footer */}
                        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-gradient-to-r from-transparent via-border to-transparent">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={getStatusBadge(schedule.status).variant}
                              className={`${getStatusBadge(schedule.status).className || ''} ${
                                schedule.patient_arrived && !['pending_validation', 'completed', 'cancelled'].includes(schedule.status) 
                                  ? 'border-emerald-500 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 font-bold shadow-md' 
                                  : ''
                              } text-sm px-3 py-1.5`}
                            >
                              {schedule.patient_arrived && !['pending_validation', 'completed', 'cancelled'].includes(schedule.status) 
                                ? '✓ Paciente Presente' 
                                : getStatusBadge(schedule.status).text}
                            </Badge>
                            {schedule.patient_arrived && schedule.arrived_at && (
                              <span className="text-xs font-medium px-2 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-500/20">
                                Chegou às {format(new Date(schedule.arrived_at), 'HH:mm', { locale: ptBR })}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão de presença do paciente para recepcionistas */}
            {(userProfile?.employee_role === 'receptionist' || isAdmin) && ['scheduled', 'confirmed'].includes(schedule.status) && (
              <PatientPresenceButton
                scheduleId={schedule.id}
                clientName={schedule.clients?.name || 'Cliente'}
                employeeId={schedule.employee_id}
                patientArrived={schedule.patient_arrived || false}
                arrivedAt={schedule.arrived_at}
                onPresenceUpdate={refetchSchedules}
              />
            )}
            
            {/* Debug: Mostrar sempre o botão para teste */}
            {!['scheduled', 'confirmed'].includes(schedule.status) && userProfile?.employee_role === 'receptionist' && (
              <Button variant="outline" size="sm" disabled className="text-gray-400">
                Presença (Status: {schedule.status})
              </Button>
            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSchedule(schedule)}
                              className="h-9 gap-2 font-medium hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all duration-300"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </Button>

                            {/* Botões de ação apenas para agendamentos pendentes */}
                            {['scheduled', 'confirmed'].includes(schedule.status) && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    console.log('🔵 Botão CONCLUIR clicado para agendamento:', schedule.id);
                                    setSelectedScheduleForAction(schedule);
                                    setCompleteDialogOpen(true);
                                    console.log('🔵 Diálogo de conclusão aberto');
                                  }}
                                  className="h-9 gap-2 font-medium bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md hover:shadow-lg transition-all duration-300"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Concluir
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedScheduleForAction(schedule);
                                    setCancelDialogOpen(true);
                                  }}
                                  className="h-9 gap-2 font-medium shadow-md hover:shadow-lg transition-all duration-300"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                            
                            {/* Status de atendimento concluído aguardando validação */}
                            {schedule.status === 'pending_validation' && (
                              <div className="flex items-center gap-2 text-amber-600">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">Aguardando validação do coordenador</span>
                              </div>
                            )}

                            {isAdmin && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-9 gap-2 font-medium hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/50 transition-all duration-300">
                                    <ArrowRightLeft className="h-4 w-4" />
                                    Redirecionar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Redirecionar Agendamento</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Selecione o profissional para quem deseja redirecionar este agendamento.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <Select onValueChange={(value) => handleRedirect(schedule.id, value)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um profissional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {employees.filter(emp => emp.user_id !== schedule.employee_id).map((employee) => (
                                        <SelectItem key={employee.user_id} value={employee.user_id}>
                                          {employee.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Dialogs */}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-50 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:scale-110 transition-all duration-300"
              onClick={() => {
                setEditingSchedule(null);
                const defaultEmployeeId = !isAdmin && employees.length === 1 ? employees[0].user_id : '';
                setNewAppointment({
                  client_id: '',
                  employee_id: defaultEmployeeId,
                  title: 'Consulta',
                  start_time: '',
                  end_time: '',
                  notes: '',
                  unit: 'madre',
                  sessionCount: 1
                });
              }}
            >
              <Plus className="h-7 w-7" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
            </DialogHeader>
            
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto px-1">
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Paciente</Label>
                    <PatientCommandAutocomplete
                      value={newAppointment.client_id}
                      onValueChange={(value) => setNewAppointment({ ...newAppointment, client_id: value })}
                      placeholder="Buscar paciente por nome, CPF, telefone ou email..."
                      unitFilter={
                        userProfile?.employee_role === 'coordinator_madre' ? 'madre' :
                        userProfile?.employee_role === 'coordinator_floresta' ? 'floresta' :
                        'all'
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Profissional</Label>
                    <ProfessionalCommandAutocomplete
                      value={newAppointment.employee_id}
                      onValueChange={(value) => setNewAppointment({ ...newAppointment, employee_id: value })}
                      placeholder="Buscar profissional por nome, email ou telefone..."
                      unitFilter={
                        // Para coordenadores, usar sua unidade específica
                        userProfile?.employee_role === 'coordinator_madre' ? 'madre' :
                        userProfile?.employee_role === 'coordinator_floresta' ? 'floresta' :
                        // Para recepcionistas, usar a unidade do agendamento sendo criado
                        userProfile?.employee_role === 'receptionist' ? newAppointment.unit :
                        // Para diretores, mostrar todos
                        'all'
                      }
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Data e Hora Início</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={newAppointment.start_time}
                      onChange={(e) => setNewAppointment({...newAppointment, start_time: e.target.value})}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Data e Hora Fim</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={newAppointment.end_time}
                      onChange={(e) => setNewAppointment({...newAppointment, end_time: e.target.value})}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tipo de Consulta</Label>
                    <Select value={newAppointment.title} onValueChange={(value) => setNewAppointment({...newAppointment, title: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        <SelectItem value="Consulta">Consulta</SelectItem>
                        <SelectItem value="Primeira Consulta">Primeira Consulta</SelectItem>
                        <SelectItem value="Avaliação">Avaliação</SelectItem>
                        <SelectItem value="Retorno">Retorno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <Select 
                      value={newAppointment.unit} 
                      onValueChange={(value) => setNewAppointment({...newAppointment, unit: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        <SelectItem value="madre">MADRE</SelectItem>
                        <SelectItem value="floresta">Floresta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {!editingSchedule && (
                  <div className="space-y-2">
                    <Label htmlFor="sessionCount">Quantidade de Sessões</Label>
                    <Input
                      id="sessionCount"
                      type="number"
                      min="1"
                      max="52"
                      value={newAppointment.sessionCount}
                      onChange={(e) => setNewAppointment({...newAppointment, sessionCount: Math.max(1, parseInt(e.target.value) || 1)})}
                      placeholder="1"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Defina quantas sessões sequenciais semanais deseja criar. O sistema verificará automaticamente conflitos de horário.
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                    placeholder="Observações opcionais..."
                    rows={4}
                    className="resize-none w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Fixed footer with action buttons */}
            <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t bg-background">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAppointment}>
                {editingSchedule ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
        />
      </div>
    </div>
  );
}
