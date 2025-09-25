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
import { Plus, Calendar as CalendarIcon, Clock, User, Edit, CheckCircle, XCircle, ArrowRightLeft, Filter, Users, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduleAlerts } from '@/components/ScheduleAlerts';
import { ConfirmAppointmentDialog } from '@/components/ConfirmAppointmentDialog';
import { CancelAppointmentDialog } from '@/components/CancelAppointmentDialog';
import CompleteAttendanceDialog from '@/components/CompleteAttendanceDialog';

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
  clients?: { name: string };
  
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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
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
  const isAdmin = userProfile?.employee_role === 'director' || 
                  userProfile?.employee_role === 'coordinator_madre' || 
                  userProfile?.employee_role === 'coordinator_floresta' ||
                  userProfile?.employee_role === 'receptionist';

  const [newAppointment, setNewAppointment] = useState({
    client_id: '',
    employee_id: '',
    title: 'Consulta',
    start_time: '',
    end_time: '',
    notes: '',
    unit: 'madre'
  });

  // Auto-definir a unidade baseada no coordenador logado
  useEffect(() => {
    if (userProfile) {
      let defaultUnit = 'madre';
      
      if (userProfile.employee_role === 'coordinator_floresta') {
        defaultUnit = 'floresta';
      } else if (userProfile.employee_role === 'coordinator_madre') {
        defaultUnit = 'madre';
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
        .select('user_id, id, name, employee_role, department')
        .eq('is_active', true)
        .order('name');

      // Aplicar filtros baseados no role do usuário para funcionários
      if (userProfile) {
        if (userProfile.employee_role === 'coordinator_madre') {
          // Coordenador Madre pode ver profissionais da unidade madre
          query = query.or(`employee_role.eq.coordinator_madre,employee_role.eq.staff,employee_role.eq.psychologist,employee_role.eq.psychopedagogue,employee_role.eq.speech_therapist,employee_role.eq.nutritionist,employee_role.eq.physiotherapist,employee_role.eq.musictherapist,user_id.eq.${user?.id}`);
        } else if (userProfile.employee_role === 'coordinator_floresta') {
          // Coordenador Floresta pode ver profissionais da unidade floresta
          query = query.or(`employee_role.eq.coordinator_floresta,employee_role.eq.staff,employee_role.eq.psychologist,employee_role.eq.psychopedagogue,employee_role.eq.speech_therapist,employee_role.eq.nutritionist,employee_role.eq.physiotherapist,employee_role.eq.musictherapist,user_id.eq.${user?.id}`);
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
    setLoading(true);
    try {
      let query = supabase
        .from('schedules')
        .select(`
          *,
          clients (name),
          profiles!schedules_employee_id_fkey (name)
        `)
        .gte('start_time', format(selectedDate, 'yyyy-MM-dd'))
        .lt('start_time', format(new Date(selectedDate.getTime() + 24*60*60*1000), 'yyyy-MM-dd'))
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
        } else if (!['director', 'receptionist'].includes(userProfile.employee_role)) {
          // Para outros profissionais, mostrar apenas seus próprios agendamentos
          query = query.eq('employee_id', userProfile.id);
        }
        // Diretores e recepcionistas veem todos os agendamentos (sem filtro adicional)
      }

            // Filtros adicionais para administradores
            if (filterEmployee !== 'all') {
              query = query.eq('employee_id', filterEmployee);
            }
            
            if (filterUnit !== 'all') {
              query = query.eq('unit', filterUnit);
            }

      const { data, error } = await query;
      if (error) {
        console.error('Schedule query error:', error);
        // Fallback query sem o join de profiles se houver erro
        const fallbackQuery = supabase
          .from('schedules')
          .select(`*, clients (name)`)
          .gte('start_time', format(selectedDate, 'yyyy-MM-dd'))
          .lt('start_time', format(new Date(selectedDate.getTime() + 24*60*60*1000), 'yyyy-MM-dd'))
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
        // Verificar conflitos de horário antes de atualizar agendamento
        const startTime = convertToISOString(newAppointment.start_time);
        const endTime = convertToISOString(newAppointment.end_time);
        
        // Verificar conflitos para o paciente (excluindo o agendamento atual)
        const { data: clientConflicts } = await supabase
          .from('schedules')
          .select('id, start_time, end_time')
          .eq('client_id', newAppointment.client_id)
          .neq('id', editingSchedule.id)
          .neq('status', 'cancelled')
          .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

        // Verificar conflitos para o profissional (excluindo o agendamento atual)
        const { data: employeeConflicts } = await supabase
          .from('schedules')
          .select('id, start_time, end_time')
          .eq('employee_id', newAppointment.employee_id)
          .neq('id', editingSchedule.id)
          .neq('status', 'cancelled')
          .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

        if (clientConflicts && clientConflicts.length > 0) {
          toast({
            variant: "destructive",
            title: "Conflito de Horário",
            description: "O paciente já possui um agendamento neste horário.",
          });
          return;
        }

        if (employeeConflicts && employeeConflicts.length > 0) {
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
        // Verificar conflitos de horário antes de criar novo agendamento
        const startTime = convertToISOString(newAppointment.start_time);
        const endTime = convertToISOString(newAppointment.end_time);
        
        // Verificar conflitos para o paciente
        const { data: clientConflicts } = await supabase
          .from('schedules')
          .select('id, start_time, end_time')
          .eq('client_id', newAppointment.client_id)
          .neq('status', 'cancelled')
          .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

        // Verificar conflitos para o profissional
        const { data: employeeConflicts } = await supabase
          .from('schedules')
          .select('id, start_time, end_time')
          .eq('employee_id', newAppointment.employee_id)
          .neq('status', 'cancelled')
          .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

        if (clientConflicts && clientConflicts.length > 0) {
          toast({
            variant: "destructive",
            title: "Conflito de Horário",
            description: "O paciente já possui um agendamento neste horário.",
          });
          return;
        }

        if (employeeConflicts && employeeConflicts.length > 0) {
          toast({
            variant: "destructive", 
            title: "Conflito de Horário",
            description: "O profissional já possui um agendamento neste horário.",
          });
          return;
        }

        const { error } = await supabase
          .from('schedules')
          .insert([{
            ...appointmentData,
            status: 'scheduled'
          }]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Agendamento criado com sucesso!",
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
        unit: 'madre'
      });
      loadSchedules();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o agendamento.",
      });
    }
  };

  const handleConfirmAppointment = async (scheduleId: string, sessionData: any, materials: any[]) => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          variant: "destructive",
          title: "Sessão Expirada",
          description: "Sua sessão expirou. Faça login novamente para continuar.",
        });
        return;
      }

      // Get schedule details for client information
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('client_id')
        .eq('id', scheduleId)
        .single();

      // Update schedule status
      const { error: updateError } = await supabase
        .from('schedules')
        .update({ 
          status: 'completed',
          notes: sessionData.progressNotes || 'Atendimento confirmado'
        })
        .eq('id', scheduleId);

      if (updateError) throw updateError;

      // Update client data with session information
      const { error: clientUpdateError } = await supabase
        .from('clients')
        .update({
          last_session_notes: sessionData.progressNotes,
          last_session_date: new Date().toISOString().split('T')[0],
          last_session_type: sessionData.sessionType,
          treatment_progress: sessionData.treatmentPlan,
          current_symptoms: sessionData.symptoms,
          current_medications: sessionData.medications ? [{ medication: sessionData.medications }] : [],
          vital_signs_history: sessionData.vitalSigns,
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleData?.client_id);

      if (clientUpdateError) console.error('Client update error:', clientUpdateError);

      // Create medical record with complete session data
      const { error: medicalRecordError } = await supabase
        .from('medical_records')
        .insert({
          client_id: scheduleData?.client_id,
          employee_id: userProfile?.id,
          session_date: new Date().toISOString().split('T')[0],
          session_type: sessionData.sessionType || 'Atendimento',
          session_duration: sessionData.actualDuration,
          symptoms: sessionData.symptoms,
          progress_notes: sessionData.progressNotes,
          treatment_plan: sessionData.treatmentPlan,
          next_appointment_notes: sessionData.nextAppointmentNotes,
          medications: sessionData.medications ? [{ medication: sessionData.medications }] : [],
          vital_signs: sessionData.vitalSigns,
          attachments: []
        });

      if (medicalRecordError) console.error('Medical record error:', medicalRecordError);

      // Create employee report
      const { error: employeeReportError } = await supabase
        .from('employee_reports')
        .insert({
          employee_id: userProfile?.id,
          client_id: scheduleData?.client_id,
          schedule_id: scheduleId,
          session_date: new Date().toISOString().split('T')[0],
          session_type: sessionData.sessionType,
          session_duration: sessionData.actualDuration,
          effort_rating: sessionData.professionalEffort,
          quality_rating: sessionData.sessionQuality,
          patient_cooperation: sessionData.clientSatisfaction,
          goal_achievement: sessionData.clientSatisfaction,
          session_objectives: sessionData.treatmentPlan,
          techniques_used: sessionData.interventionTechniques,
          patient_response: sessionData.clientResponse,
          professional_notes: sessionData.professionalObservations,
          next_session_plan: sessionData.nextSessionPreparation,
          materials_used: materials.map(m => ({
            stock_item_id: m.stock_item_id,
            name: m.name,
            quantity: m.quantity,
            unit_cost: m.unit_cost,
            observation: m.observation
          })),
          materials_cost: materials.reduce((sum, m) => sum + ((m.unit_cost || 0) * m.quantity), 0),
          session_location: sessionData.sessionLocation,
          supervision_required: sessionData.supervisionRequired,
          follow_up_needed: sessionData.followUpNeeded
        });

      if (employeeReportError) console.error('Employee report error:', employeeReportError);

      // Create financial record
      if (sessionData.sessionValue > 0) {
        const { error: financialError } = await supabase
          .from('financial_records')
          .insert({
            type: 'revenue',
            category: 'Consulta',
            description: `Sessão ${sessionData.sessionType} - ${scheduleData?.client_id}`,
            amount: sessionData.finalValue,
            date: new Date().toISOString().split('T')[0],
            payment_method: sessionData.paymentMethod,
            client_id: scheduleData?.client_id,
            employee_id: user?.id,
            created_by: user?.id,
            notes: sessionData.paymentNotes
          });

        if (financialError) console.error('Financial record error:', financialError);
      }

      // Create stock movements for used materials
      if (materials.length > 0) {
        const stockMovements = materials.map(material => ({
          stock_item_id: material.stock_item_id,
          type: 'out',
          quantity: material.quantity,
          reason: 'Utilizado em atendimento',
          notes: material.observation || `Sessão - Paciente ID: ${scheduleData?.client_id}`,
          date: new Date().toISOString().split('T')[0],
          created_by: user?.id,
          client_id: scheduleData?.client_id,
          schedule_id: scheduleId,
          session_number: 1,
          unit_cost: material.unit_cost,
          total_cost: (material.unit_cost || 0) * material.quantity
        }));

        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert(stockMovements);

        if (movementError) throw movementError;

        // Update stock quantities
        for (const material of materials) {
          const { data: currentItem } = await supabase
            .from('stock_items')
            .select('current_quantity')
            .eq('id', material.stock_item_id)
            .single();

          if (currentItem) {
            const newQuantity = Math.max(0, currentItem.current_quantity - material.quantity);
            await supabase
              .from('stock_items')
              .update({ current_quantity: newQuantity })
              .eq('id', material.stock_item_id);
          }
        }
      }

      toast({
        title: "Atendimento confirmado!",
        description: "Dados clínicos, financeiros e de materiais foram registrados com sucesso.",
      });

      loadSchedules();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível confirmar o atendimento.",
      });
    }
  };

  const handleCancelAppointment = async (scheduleId: string, reason: string, category: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ 
          status: 'cancelled',
          notes: `Cancelado - Categoria: ${category}. Motivo: ${reason}`
        })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado e o motivo foi registrado.",
      });

      loadSchedules();
    } catch (error) {
      console.error('Error canceling appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
      });
    }
  };

  const openCompleteDialog = (schedule: Schedule) => {
    setSelectedScheduleForAction(schedule);
    setCompleteDialogOpen(true);
  };

  const openConfirmDialog = (schedule: Schedule) => {
    setSelectedScheduleForAction(schedule);
    setConfirmDialogOpen(true);
  };

  const openCancelDialog = (schedule: Schedule) => {
    setSelectedScheduleForAction(schedule);
    setCancelDialogOpen(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    
    // Convert ISO strings to local datetime format for datetime-local inputs
    const formatDateTimeLocal = (isoString: string) => {
      const date = new Date(isoString);
      // Get local timezone offset and adjust
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().slice(0, 16);
    };
    
    setNewAppointment({
      client_id: schedule.client_id,
      employee_id: schedule.employee_id,
      title: schedule.title,
      start_time: formatDateTimeLocal(schedule.start_time),
      end_time: formatDateTimeLocal(schedule.end_time),
      notes: schedule.notes || '',
      unit: schedule.unit || 'madre'
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
      console.error('Error redirecting schedule:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível redirecionar o agendamento.",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'confirmed': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const todaySchedules = schedules;

  const uniqueRoles = [...new Set(employees.map(emp => emp.employee_role))];
  const departmentEmployees = employees.filter(emp => {
    if (filterUnit === 'madre') {
      return emp.department?.toLowerCase().includes('madre') || emp.employee_role === 'coordinator_madre';
    }
    if (filterUnit === 'floresta') {
      return emp.department?.toLowerCase().includes('floresta') || emp.employee_role === 'coordinator_floresta';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alertas de Agendamento */}
      <ScheduleAlerts />
      
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Agenda</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da esquerda - Calendário */}
          <Card className="lg:col-span-1 gradient-card shadow-professional">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <CalendarIcon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="rounded-md border w-full pointer-events-auto"
              />
            </CardContent>
          </Card>

          {/* Coluna da direita - Filtros e Botão */}
          <div className="lg:col-span-2 space-y-4">
            {/* Data selecionada */}
            <div className="flex items-center gap-2 text-lg font-medium">
              <span>{format(selectedDate, "dd/MM/yyyy")}</span>
            </div>

            {/* Filtros - Para Diretores e Coordenadores */}
            {(userProfile?.employee_role === 'director' || 
              userProfile?.employee_role === 'coordinator_madre' || 
              userProfile?.employee_role === 'coordinator_floresta') && (
              <Card className="gradient-card shadow-professional border-primary/10">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-primary">
                        Filtros Avançados
                        {userProfile?.employee_role === 'coordinator_madre' && 
                          <span className="text-xs text-muted-foreground ml-2">(Unidade Madre)</span>
                        }
                        {userProfile?.employee_role === 'coordinator_floresta' && 
                          <span className="text-xs text-muted-foreground ml-2">(Unidade Floresta)</span>
                        }
                      </h3>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground">Filtrar por Cargo:</Label>
                      <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Todos os Cargos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Cargos</SelectItem>
                          {uniqueRoles.map(role => (
                            <SelectItem key={role} value={role}>
                              {role === 'director' ? 'Diretor' :
                               role === 'coordinator_madre' ? 'Coordenador Madre' :
                               role === 'coordinator_floresta' ? 'Coordenador Floresta' :
                               role === 'administrative' ? 'Administrativo' : 'Staff'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-foreground">Ver agenda de:</Label>
                      <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Todos os Profissionais" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Profissionais</SelectItem>
                          {departmentEmployees.map(employee => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-foreground">Filtrar por Unidade:</Label>
                      <Select value={filterUnit} onValueChange={setFilterUnit}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Todas as Unidades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as Unidades</SelectItem>
                          <SelectItem value="madre">Clínica Social (Madre)</SelectItem>
                          <SelectItem value="floresta">Neuro (Floresta)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botão Novo Agendamento */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
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
                      unit: 'madre'
                    });
                  }}
                 >
                  <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingSchedule ? 'Editar' : 'Novo'} Agendamento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Paciente</Label>
                    {userProfile?.employee_role === 'coordinator_madre' && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Você pode agendar apenas para pacientes da unidade Madre.
                      </p>
                    )}
                    {userProfile?.employee_role === 'coordinator_floresta' && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Você pode agendar apenas para pacientes da unidade Floresta.
                      </p>
                    )}
                    {!isAdmin && !['coordinator_madre', 'coordinator_floresta'].includes(userProfile?.employee_role || '') && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Você só pode agendar para pacientes vinculados ao seu atendimento.
                      </p>
                    )}
                    <Select 
                      value={newAppointment.client_id} 
                      onValueChange={(value) => setNewAppointment({ ...newAppointment, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Profissional</Label>
                    {!isAdmin && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Como profissional, você só pode agendar para si mesmo.
                      </p>
                    )}
                    <Select 
                      value={newAppointment.employee_id} 
                      onValueChange={(value) => setNewAppointment({ ...newAppointment, employee_id: value })}
                      disabled={!isAdmin && employees.length === 1}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um profissional" />
                      </SelectTrigger>
                      <SelectContent>
                         {employees.map(employee => (
                           <SelectItem key={employee.user_id} value={employee.id}>
                             {employee.name} ({employee.employee_role})
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_time">Data e Hora Início</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={newAppointment.start_time}
                      onChange={(e) => setNewAppointment({ ...newAppointment, start_time: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Data e Hora Fim</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={newAppointment.end_time}
                      onChange={(e) => setNewAppointment({ ...newAppointment, end_time: e.target.value })}
                    />
                  </div>
                  
                   <div className="space-y-2">
                     <Label htmlFor="title">Título</Label>
                     <Input
                       id="title"
                       value={newAppointment.title}
                       onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                       placeholder="Título do agendamento"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="unit">Unidade</Label>
                     <Select 
                       value={newAppointment.unit} 
                       onValueChange={(value) => setNewAppointment({ ...newAppointment, unit: value })}
                       disabled={userProfile?.employee_role === 'coordinator_madre' || userProfile?.employee_role === 'coordinator_floresta'}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Selecione a unidade" />
                       </SelectTrigger>
                        <SelectContent>
                          {(userProfile?.employee_role === 'director' || userProfile?.employee_role === 'receptionist') && (
                            <>
                              <SelectItem value="madre">Madre Mazzarello</SelectItem>
                              <SelectItem value="floresta">Floresta</SelectItem>
                            </>
                          )}
                          {userProfile?.employee_role === 'coordinator_madre' && (
                            <SelectItem value="madre">Madre Mazzarello</SelectItem>
                          )}
                          {userProfile?.employee_role === 'coordinator_floresta' && (
                            <SelectItem value="floresta">Floresta</SelectItem>
                          )}
                        </SelectContent>
                     </Select>
                     {(userProfile?.employee_role === 'coordinator_madre' || userProfile?.employee_role === 'coordinator_floresta') && (
                       <p className="text-sm text-muted-foreground">
                         Você só pode agendar para sua unidade.
                       </p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="notes">Observações</Label>
                     <Textarea
                       id="notes"
                       value={newAppointment.notes}
                       onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                       placeholder="Informações adicionais sobre o agendamento"
                     />
                   </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAppointment}>
                    {editingSchedule ? 'Atualizar' : 'Agendar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

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
                      <div key={schedule.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="flex-1 w-full md:w-auto">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm md:text-base">
                              {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })} - {format(new Date(schedule.end_time), 'HH:mm', { locale: ptBR })}
                            </span>
                            <Badge variant="outline" className="text-xs">{schedule.title}</Badge>
                          </div>
                           <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2 flex-wrap">
                             <User className="h-3 w-3" />
                             <span>Paciente: {schedule.clients?.name || 'N/A'}</span>
                             <span className="hidden md:inline">•</span>
                             <span>Profissional: {employees.find(emp => emp.id === schedule.employee_id)?.name || 'N/A'}</span>
                             <span className="hidden md:inline">•</span>
                              <Badge variant={schedule.unit === 'madre' ? 'default' : 'secondary'} className="text-xs">
                                {schedule.unit === 'madre' ? 'Madre Mazzarello' : 'Floresta'}
                              </Badge>
                           </div>
                          {schedule.notes && (
                            <p className="text-xs md:text-sm text-muted-foreground">{schedule.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <Badge variant={getStatusColor(schedule.status)} className="text-xs">
                            {getStatusLabel(schedule.status)}
                          </Badge>
                          
                          {/* Botões de ação - permitir edição em qualquer status */}
                          {(userProfile?.employee_role === 'director' || 
                            userProfile?.employee_role === 'coordinator_madre' || 
                            userProfile?.employee_role === 'coordinator_floresta') && (
                            <div className="flex gap-1">
                              {(schedule.status === 'scheduled' || schedule.status === 'confirmed') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openCompleteDialog(schedule)}
                                  title="Concluir Atendimento"
                                  className="text-green-600 hover:text-green-700 shadow-professional"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              
                              {/* Permitir edição em qualquer status */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(schedule)}
                                title="Editar Agendamento"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>

                              {schedule.status !== 'cancelled' && schedule.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openCancelDialog(schedule)}
                                  title="Cancelar Agendamento"
                                  className="text-destructive hover:text-destructive shadow-professional"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              )}

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    title="Redirecionar"
                                  >
                                    <ArrowRightLeft className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Redirecionar Agendamento</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <Label>Selecione o novo profissional:</Label>
                                    <Select onValueChange={(value) => handleRedirect(schedule.id, value)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Escolha um profissional" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {employees
                                          .filter(emp => emp.id !== schedule.employee_id)
                                          .map(employee => (
                                          <SelectItem key={employee.id} value={employee.id}>
                                            {employee.name} ({employee.employee_role})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
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
            <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 animate-pulse-gentle">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Data e Hora Início</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={newAppointment.start_time}
                    onChange={(e) => setNewAppointment({...newAppointment, start_time: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Data e Hora Fim</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={newAppointment.end_time}
                    onChange={(e) => setNewAppointment({...newAppointment, end_time: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client">Paciente</Label>
                <Select value={newAppointment.client_id} onValueChange={(value) => setNewAppointment({...newAppointment, client_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employee">Profissional</Label>
                <Select value={newAppointment.employee_id} onValueChange={(value) => setNewAppointment({...newAppointment, employee_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.user_id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Tipo de Atendimento</Label>
                <Select value={newAppointment.title} onValueChange={(value) => setNewAppointment({...newAppointment, title: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consulta">Consulta</SelectItem>
                    <SelectItem value="Terapia">Terapia</SelectItem>
                    <SelectItem value="Avaliação">Avaliação</SelectItem>
                    <SelectItem value="Retorno">Retorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select value={newAppointment.unit} onValueChange={(value) => setNewAppointment({...newAppointment, unit: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="madre">Madre Mazzarello</SelectItem>
                    <SelectItem value="floresta">Floresta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                  placeholder="Observações opcionais..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
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

        <ConfirmAppointmentDialog
          schedule={selectedScheduleForAction}
          isOpen={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          onConfirm={handleConfirmAppointment}
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