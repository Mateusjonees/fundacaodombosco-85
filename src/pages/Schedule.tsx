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
  const [selectedScheduleForAction, setSelectedScheduleForAction] = useState<Schedule | null>(null);
  const { toast } = useToast();

  // Filtros
  const [filterRole, setFilterRole] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');

  // Verificar se o usuário é coordenador ou diretor
  const [userProfile, setUserProfile] = useState<any>(null);
  const isCoordinatorOrDirector = userProfile?.employee_role === 'director' || 
                                  userProfile?.employee_role === 'coordinator_madre' || 
                                  userProfile?.employee_role === 'coordinator_floresta';

  const [newAppointment, setNewAppointment] = useState({
    client_id: '',
    employee_id: '',
    title: 'Consulta',
    start_time: '',
    end_time: '',
    notes: ''
  });

  useEffect(() => {
    loadUserProfile();
    loadEmployees();
    loadClients();
    loadSchedules();
  }, [selectedDate, filterRole, filterEmployee, filterUnit]);

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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, employee_role, department')
        .eq('is_active', true)
        .order('name');
      
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
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      // Apply role-based filtering using client_assignments (matches RLS policies)
      if (userProfile && !['director', 'coordinator_madre', 'coordinator_floresta'].includes(userProfile.employee_role)) {
        // For staff members, only show clients they are assigned to via client_assignments
        const { data: assignments } = await supabase
          .from('client_assignments')
          .select('client_id')
          .eq('employee_id', user?.id)
          .eq('is_active', true);
        
        const clientIds = [...new Set(assignments?.map(a => a.client_id) || [])];
        if (clientIds.length > 0) {
          query = query.in('id', clientIds);
        } else {
          // If no assignments, show no clients
          setClients([]);
          return;
        }
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
          clients (name)
        `)
        .gte('start_time', format(selectedDate, 'yyyy-MM-dd'))
        .lt('start_time', format(new Date(selectedDate.getTime() + 24*60*60*1000), 'yyyy-MM-dd'))
        .order('start_time');

      // Apply role-based filtering - staff only see appointments where they are assigned
      if (userProfile && !['director', 'coordinator_madre', 'coordinator_floresta'].includes(userProfile.employee_role)) {
        query = query.eq('employee_id', user?.id);
      }

      // Apply additional filters for coordinators/directors
      if (filterEmployee !== 'all') {
        query = query.eq('employee_id', filterEmployee);
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
        created_by: user?.id
      };

      if (editingSchedule) {
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
        notes: ''
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

      // Create medical record with complete session data
      const { error: medicalRecordError } = await supabase
        .from('medical_records')
        .insert({
          client_id: scheduleData?.client_id,
          employee_id: user?.id,
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
          notes: material.observation || `Sessão - Cliente ID: ${scheduleData?.client_id}`,
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
      notes: schedule.notes || ''
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

            {/* Filtros - Apenas para Diretores */}
            {userProfile?.employee_role === 'director' && (
              <Card className="gradient-card shadow-professional border-primary/10">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-primary">Filtros Avançados</h3>
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
                    setNewAppointment({
                      client_id: '',
                      employee_id: '',
                      title: 'Consulta',
                      start_time: '',
                      end_time: '',
                      notes: ''
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
                    <Label htmlFor="client_id">Cliente</Label>
                    <Select value={newAppointment.client_id} onValueChange={(value) => setNewAppointment({ ...newAppointment, client_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
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
                    <Select value={newAppointment.employee_id} onValueChange={(value) => setNewAppointment({ ...newAppointment, employee_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
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
                            <span>Cliente: {schedule.clients?.name || 'N/A'}</span>
                            <span className="hidden md:inline">•</span>
                            <span>Profissional: {employees.find(emp => emp.id === schedule.employee_id)?.name || 'N/A'}</span>
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
                                  onClick={() => openConfirmDialog(schedule)}
                                  title="Confirmar Atendimento"
                                  className="text-primary hover:text-primary shadow-professional"
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
        <ConfirmAppointmentDialog
          isOpen={confirmDialogOpen}
          onClose={() => {
            setConfirmDialogOpen(false);
            setSelectedScheduleForAction(null);
          }}
          schedule={selectedScheduleForAction}
          onConfirm={handleConfirmAppointment}
        />

        <CancelAppointmentDialog
          isOpen={cancelDialogOpen}
          onClose={() => {
            setCancelDialogOpen(false);
            setSelectedScheduleForAction(null);
          }}
          schedule={selectedScheduleForAction}
          onCancel={handleCancelAppointment}
        />

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
                <Label htmlFor="client">Cliente</Label>
                <Select value={newAppointment.client_id} onValueChange={(value) => setNewAppointment({...newAppointment, client_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
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
                      <SelectItem key={employee.id} value={employee.id}>
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
      </div>
    </div>
  );
}