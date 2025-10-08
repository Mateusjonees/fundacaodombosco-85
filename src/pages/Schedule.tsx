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
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedScheduleForAction, setSelectedScheduleForAction] = useState<Schedule | null>(null);
  const { toast } = useToast();

  // Filtros
  const [filterRole, setFilterRole] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');

  // Verificar se o usuário tem permissões administrativas
  const [userProfile, setUserProfile] = useState<any>(null);
  const userRole = userProfile?.employee_role;
  const isAdmin = userRole === 'director' || 
                  userRole === 'coordinator_madre' || 
                  userRole === 'coordinator_floresta' ||
                  userRole === 'receptionist';

  console.log('User profile:', userProfile); // Debug log

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
    loadUserProfile();
    loadEmployees();
    loadClients();
    loadSchedules();
    
    // Verificar se há parâmetros na URL para pré-preencher o formulário
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id') || urlParams.get('client');
    const clientName = urlParams.get('client_name');
    
    if (clientId) {
      setNewAppointment(prev => ({
        ...prev,
        client_id: clientId
      }));
      
      // Se tem ID do paciente, abrir o diálogo de agendamento
      setIsDialogOpen(true);
    }
  }, [selectedDate, filterRole, filterEmployee, filterUnit]);

  // Auto-selecionar o profissional para usuários não-administrativos
  useEffect(() => {
    if (userProfile && !isAdmin) {
      setNewAppointment(prev => ({
        ...prev,
        employee_id: userProfile.id
      }));
    }
  }, [userProfile, isAdmin]);

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
        .select('user_id, id, name, employee_role, department, unit')
        .eq('is_active', true)
        .not('employee_role', 'is', null)
        .order('name');

      // Aplicar filtros baseados no role do usuário para funcionários
      if (userProfile) {
        if (userProfile.employee_role === 'coordinator_madre') {
          // Coordenador Madre pode ver todos os profissionais exceto os específicos do floresta
          query = query.not('employee_role', 'eq', 'coordinator_floresta');
        } else if (userProfile.employee_role === 'coordinator_floresta') {
          // Coordenador Floresta pode ver todos os profissionais exceto os específicos da madre
          query = query.not('employee_role', 'eq', 'coordinator_madre');
        } else if (!['director', 'receptionist'].includes(userProfile.employee_role)) {
          // Para outros profissionais, só mostrar eles mesmos
          query = query.eq('user_id', user?.id);
        }
        // Diretores e recepcionistas veem todos os funcionários (sem filtro adicional)
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadClients = async () => {
    try {
      let query = supabase
        .from('clients')
        .select('id, name, unit')
        .eq('is_active', true)
        .order('name');

      // Aplicar filtros baseados no role do usuário
      if (userProfile) {
        if (userProfile.employee_role === 'coordinator_madre') {
          // Coordenador Madre vê apenas clientes da unidade madre ou sem unidade definida
          query = query.or('unit.eq.madre,unit.is.null');
        } else if (userProfile.employee_role === 'coordinator_floresta') {
          // Coordenador Floresta vê apenas clientes da unidade floresta
          query = query.eq('unit', 'floresta');
        } else if (!['director', 'receptionist'].includes(userProfile.employee_role)) {
          // Para outros profissionais, mostrar apenas pacientes vinculados
          const { data: assignments } = await supabase
            .from('client_assignments')
            .select('client_id')
            .eq('employee_id', userProfile.id)
            .eq('is_active', true);
          
          const clientIds = [...new Set(assignments?.map(a => a.client_id) || [])];
          if (clientIds.length > 0) {
            query = query.in('id', clientIds);
          } else {
            // Se não há pacientes vinculados, não mostrar nenhum
            setClients([]);
            return;
          }
        }
        // Diretores e recepcionistas veem todos os clientes (sem filtro adicional)
      }

      const { data, error } = await query;
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadSchedules = async () => {
    console.log('🔄 RECARREGANDO AGENDAMENTOS...');
    setLoading(true);
    try {
      let query = supabase
        .from('schedules')
        .select(`
          *,
          patient_arrived,
          arrived_at,
          arrived_confirmed_by,
          clients (name),
          profiles!schedules_employee_id_fkey (name)
        `)
        .gte('start_time', format(selectedDate, 'yyyy-MM-dd'))
        .lt('start_time', format(new Date(selectedDate.getTime() + 24*60*60*1000), 'yyyy-MM-dd'))
        .in('status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'pending_validation'])
        .order('start_time');

      // Aplicar filtros baseados no role do usuário para agendamentos
      if (userProfile) {
        if (userProfile.employee_role === 'coordinator_madre') {
          // Coordenador Madre vê agendamentos de clientes da unidade madre
          const { data: clientsInUnit } = await supabase
            .from('clients')
            .select('id')
            .or('unit.eq.madre,unit.is.null')
            .eq('is_active', true);
          
          const clientIds = clientsInUnit?.map(c => c.id) || [];
          if (clientIds.length > 0) {
            query = query.in('client_id', clientIds);
          }
        } else if (userProfile.employee_role === 'coordinator_floresta') {
          // Coordenador Floresta vê agendamentos de clientes da unidade floresta
          const { data: clientsInUnit } = await supabase
            .from('clients')
            .select('id')
            .eq('unit', 'floresta')
            .eq('is_active', true);
          
          const clientIds = clientsInUnit?.map(c => c.id) || [];
          if (clientIds.length > 0) {
            query = query.in('client_id', clientIds);
          }
        } else if (userProfile.employee_role === 'receptionist') {
          // Recepcionista vê agendamentos apenas da sua unidade
          const userUnit = userProfile.unit || 'madre';
          const { data: clientsInUnit } = await supabase
            .from('clients')
            .select('id')
            .eq('unit', userUnit)
            .eq('is_active', true);
          
          const clientIds = clientsInUnit?.map(c => c.id) || [];
          if (clientIds.length > 0) {
            query = query.in('client_id', clientIds);
          }
        } else if (userProfile.employee_role !== 'director') {
          // Para outros profissionais, mostrar apenas seus próprios agendamentos
          query = query.eq('employee_id', userProfile.id);
        }
        // Diretores veem todos os agendamentos (sem filtro adicional)
      }

            // Filtros adicionais para administradores
            if (filterEmployee !== 'all') {
              query = query.eq('employee_id', filterEmployee);
            }
            
            if (filterUnit !== 'all') {
              query = query.eq('unit', filterUnit);
            }

      const { data, error } = await query;
      console.log('📋 Agendamentos carregados:', data?.length || 0);
      if (error) {
        console.error('❌ Schedule query error:', error);
        // Fallback query sem o join de profiles se houver erro
        const fallbackQuery = supabase
          .from('schedules')
          .select(`*, clients (name)`)
          .gte('start_time', format(selectedDate, 'yyyy-MM-dd'))
          .lt('start_time', format(new Date(selectedDate.getTime() + 24*60*60*1000), 'yyyy-MM-dd'))
          .in('status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'pending_validation'])
          .order('start_time');

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        
        // Buscar nomes dos profissionais manualmente
        const schedulesWithProfiles = await Promise.all((fallbackData || []).map(async (schedule) => {
          if (schedule.employee_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', schedule.employee_id)
              .single();
            
            return {
              ...schedule,
              profiles: { name: profileData?.name || 'Nome não encontrado' }
            };
          }
          return {
            ...schedule,
            profiles: { name: 'Não atribuído' }
          };
        }));
        
        setSchedules(schedulesWithProfiles);
        return;
      }
      
      setSchedules(data || []);
      console.log('✅ Agendamentos atualizados no state');
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
      // Convert datetime-local format to ISO string maintaining local time
      const convertToISOString = (dateTimeLocal: string) => {
        if (!dateTimeLocal) return '';
        // Create date object from local datetime input and convert to ISO
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
        // Para edição, verificar conflito excluindo o próprio agendamento
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

        const { error } = await supabase
          .from('schedules')
          .update(appointmentData)
          .eq('id', editingSchedule.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Agendamento atualizado com sucesso!",
        });
      } else {
        // Para criação de múltiplas sessões
        const sessionCount = newAppointment.sessionCount || 1;
        const appointmentsToCreate = [];
        let conflictFound = false;
        
        for (let i = 0; i < sessionCount; i++) {
          const sessionDate = new Date(appointmentData.start_time);
          const sessionEndDate = new Date(appointmentData.end_time);
          
          // Adicionar i semanas à data (recorrência semanal)
          sessionDate.setDate(sessionDate.getDate() + (i * 7));
          sessionEndDate.setDate(sessionEndDate.getDate() + (i * 7));
          
          const sessionStartTime = sessionDate.toISOString();
          const sessionEndTime = sessionEndDate.toISOString();
          
          // Verificar conflito para cada sessão
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
      loadSchedules();
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
      
      loadSchedules();
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
      
      loadSchedules();
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
    const statusMap = {
      'scheduled': { text: 'Agendado', variant: 'default' as const },
      'confirmed': { text: 'Confirmado', variant: 'secondary' as const },
      'completed': { text: 'Concluído', variant: 'outline' as const },
      'pending_validation': { text: 'Aguardando Validação', variant: 'outline' as const, className: 'border-amber-500 text-amber-700 bg-amber-50' },
      'cancelled': { text: 'Cancelado', variant: 'destructive' as const }
    };
    
    return statusMap[status as keyof typeof statusMap] || { text: 'Desconhecido', variant: 'outline' as const };
  };

  // Filtrar agendamentos
  const todaySchedules = schedules.filter(schedule => {
    if (filterRole !== 'all') {
      const employee = employees.find(emp => emp.user_id === schedule.employee_id);
      if (employee && employee.employee_role !== filterRole) {
        return false;
      }
    }

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
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar esquerda com calendário e controles */}
        <div className="lg:w-80">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Calendário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="rounded-md border w-full"
                />
              </CardContent>
            </Card>

            {/* Botão Novo Agendamento - Versão Desktop */}
            <Button 
              className="w-full py-4 md:py-6 text-base md:text-lg" 
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
              <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Novo Agendamento
            </Button>

            {/* Filtros para Administradores */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filtro de Função - Apenas para Diretores */}
                  {userRole === 'director' && (
                    <div>
                      <Label htmlFor="filterRole">Função</Label>
                      <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as funções" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as funções</SelectItem>
                          <SelectItem value="psychologist">Psicólogos</SelectItem>
                          <SelectItem value="speech_therapist">Fonoaudiólogos</SelectItem>
                          <SelectItem value="occupational_therapist">Terapeutas Ocupacionais</SelectItem>
                          <SelectItem value="physiotherapist">Fisioterapeutas</SelectItem>
                          <SelectItem value="nutritionist">Nutricionistas</SelectItem>
                          <SelectItem value="neuropsychologist">Neuropsicólogos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                          <SelectItem value="madre">MADRE</SelectItem>
                          <SelectItem value="floresta">FLORESTA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Info da unidade atual para Coordenadores e Recepcionistas */}
                  {(userRole === 'coordinator_madre' || userRole === 'coordinator_floresta' || userRole === 'receptionist') && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Unidade Atual:</p>
                      <p className="text-lg font-bold">
                        {userRole === 'coordinator_madre' ? 'MADRE' : 
                         userRole === 'coordinator_floresta' ? 'FLORESTA' : 
                         userProfile?.unit === 'madre' ? 'MADRE' : 'FLORESTA'}
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
            <Card>
               <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Agenda do Dia - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Carregando agendamentos...</p>
                ) : todaySchedules.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum agendamento para esta data.
                  </p>
                ) : (
                  <div className="space-y-4">
                     {todaySchedules.map((schedule) => (
                       <div 
                         key={schedule.id} 
                         className={`p-6 border rounded-xl gap-6 transition-all duration-300 hover:shadow-lg ${
                           schedule.patient_arrived 
                             ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-green-50/60 shadow-md border-2' 
                             : 'border-border hover:border-primary/30 bg-card'
                         }`}
                       >
                        {/* Header com horário e tipo */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                              <Clock className="h-5 w-5 text-primary" />
                              {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })} - {format(new Date(schedule.end_time), 'HH:mm', { locale: ptBR })}
                            </div>
                            <Badge variant="secondary" className="text-sm font-medium">
                              {schedule.title}
                            </Badge>
                          </div>
                          <Badge variant={schedule.unit === 'madre' ? 'default' : 'secondary'} className="text-sm font-medium">
                            {schedule.unit === 'madre' ? 'MADRE' : 'FLORESTA'}
                          </Badge>
                        </div>

                        {/* Informações principais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-foreground">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">Paciente:</span>
                              <span className="font-semibold">{schedule.clients?.name || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-foreground">
                              <Stethoscope className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">Profissional:</span>
                               <span className="font-semibold">
                                 {schedule.profiles?.name || employees.find(emp => emp.user_id === schedule.employee_id)?.name || 'Não atribuído'}
                               </span>
                            </div>
                          </div>
                        </div>

                        {/* Status e observações */}
                        <div className="flex flex-col gap-3">
                          {schedule.notes && (
                            <div className="p-3 bg-muted/50 rounded-lg border border-muted">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Observações:</span> {schedule.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions footer */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-muted">
                          <div className="flex items-center gap-3">
                            <Badge 
                              {...getStatusBadge(schedule.status)} 
                              className={`${
                                schedule.patient_arrived ? 'border-emerald-500 bg-emerald-100 text-emerald-800 font-semibold' : 
                                schedule.status === 'pending_validation' ? 'border-amber-500 bg-amber-50 text-amber-700' : ''
                              } text-sm`}
                            >
                              {schedule.patient_arrived && schedule.status !== 'pending_validation' ? '✓ Paciente Presente' : getStatusBadge(schedule.status).text}
                            </Badge>
                            {schedule.patient_arrived && schedule.arrived_at && (
                              <span className="text-xs text-muted-foreground">
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
                onPresenceUpdate={loadSchedules}
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
                              className="h-9 gap-2 font-medium"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </Button>

                            {/* Botões de ação apenas para agendamentos pendentes */}
                            {['scheduled', 'confirmed'].includes(schedule.status) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    console.log('🔵 Botão CONCLUIR clicado para agendamento:', schedule.id);
                                    setSelectedScheduleForAction(schedule);
                                    setCompleteDialogOpen(true);
                                    console.log('🔵 Diálogo de conclusão aberto');
                                  }}
                                  className="h-9 gap-2 font-medium"
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
                                  className="h-9 gap-2 font-medium"
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
                                  <Button size="sm" variant="secondary" className="h-9 gap-2 font-medium">
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
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 animate-pulse-gentle"
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
              <Plus className="h-6 w-6" />
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
          onComplete={loadSchedules}
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
