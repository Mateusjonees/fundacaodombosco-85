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
  const isAdmin = userProfile?.employee_role === 'director' || 
                  userProfile?.employee_role === 'coordinator_madre' || 
                  userProfile?.employee_role === 'coordinator_floresta' ||
                  userProfile?.employee_role === 'receptionist';

  console.log('User profile:', userProfile); // Debug log

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
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [selectedDate]);

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

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      let query = supabase
        .from('schedules')
        .select(`
          *,
          clients:client_id(name),
          profiles:employee_id(name)
        `)
        .gte('start_time', `${dateStr} 00:00:00`)
        .lt('start_time', `${dateStr} 23:59:59`)
        .order('start_time');

      // Se não for admin, só mostrar agendamentos do usuário atual
      if (!isAdmin && userProfile) {
        query = query.eq('employee_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar agendamentos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, employee_role, unit')
        .eq('is_active', true)
        .not('employee_role', 'is', null);

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone, email, cpf')
        .eq('is_active', true);

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleCreateAppointment = async () => {
    if (!newAppointment.client_id || !newAppointment.employee_id || 
        !newAppointment.start_time || !newAppointment.end_time) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    try {
      if (editingSchedule) {
        const { error } = await supabase
          .from('schedules')
          .update({
            client_id: newAppointment.client_id,
            employee_id: newAppointment.employee_id,
            start_time: newAppointment.start_time,
            end_time: newAppointment.end_time,
            title: newAppointment.title,
            notes: newAppointment.notes,
            unit: newAppointment.unit
          })
          .eq('id', editingSchedule.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Agendamento atualizado!",
        });
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert({
            client_id: newAppointment.client_id,
            employee_id: newAppointment.employee_id,
            start_time: newAppointment.start_time,
            end_time: newAppointment.end_time,
            title: newAppointment.title,
            status: 'scheduled',
            notes: newAppointment.notes,
            unit: newAppointment.unit
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Agendamento criado!",
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
        description: "Erro ao salvar agendamento.",
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
      'pending_validation': { text: 'Aguardando Validação', variant: 'secondary' as const },
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <PatientArrivedNotification />
        <ScheduleAlerts />
        
        {/* Header da Página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus agendamentos e compromissos
          </p>
        </div>
        
        {/* Layout Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar Esquerda - Calendário e Controles */}
          <div className="xl:col-span-1">
            <div className="space-y-6 sticky top-6">
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

              {/* Botão Novo Agendamento - Desktop */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full py-4 text-base font-medium hidden xl:flex" 
                    size="lg"
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
                        unit: 'madre'
                      });
                    }}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-6">
                    <DialogTitle className="text-2xl font-semibold">
                      {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="client_id" className="text-sm font-medium">Paciente</Label>
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

                      <div className="space-y-3">
                        <Label htmlFor="employee_id" className="text-sm font-medium">Profissional</Label>
                        <ProfessionalCommandAutocomplete
                          value={newAppointment.employee_id}
                          onValueChange={(value) => setNewAppointment({ ...newAppointment, employee_id: value })}
                          placeholder="Buscar profissional por nome, email ou telefone..."
                          unitFilter={
                            userProfile?.employee_role === 'coordinator_madre' ? 'madre' :
                            userProfile?.employee_role === 'coordinator_floresta' ? 'floresta' :
                            'all'
                          }
                          disabled={!isAdmin}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="start_time" className="text-sm font-medium">Data e Hora Início</Label>
                        <Input
                          id="start_time"
                          type="datetime-local"
                          value={newAppointment.start_time}
                          onChange={(e) => setNewAppointment({...newAppointment, start_time: e.target.value})}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="end_time" className="text-sm font-medium">Data e Hora Fim</Label>
                        <Input
                          id="end_time"
                          type="datetime-local"
                          value={newAppointment.end_time}
                          onChange={(e) => setNewAppointment({...newAppointment, end_time: e.target.value})}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="title" className="text-sm font-medium">Tipo de Consulta</Label>
                        <Select value={newAppointment.title} onValueChange={(value) => setNewAppointment({...newAppointment, title: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Consulta">Consulta</SelectItem>
                            <SelectItem value="Primeira Consulta">Primeira Consulta</SelectItem>
                            <SelectItem value="Avaliação">Avaliação</SelectItem>
                            <SelectItem value="Retorno">Retorno</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="unit" className="text-sm font-medium">Unidade</Label>
                        <Select value={newAppointment.unit} onValueChange={(value) => setNewAppointment({...newAppointment, unit: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="madre">MADRE</SelectItem>
                            <SelectItem value="floresta">Floresta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
                      <Textarea
                        id="notes"
                        value={newAppointment.notes}
                        onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                        placeholder="Observações opcionais..."
                        className="min-h-20"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateAppointment}>
                      {editingSchedule ? 'Salvar' : 'Criar'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

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
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Função</Label>
                      <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as funções</SelectItem>
                          <SelectItem value="psychologist">Psicólogo</SelectItem>
                          <SelectItem value="neuropsychologist">Neuropsicólogo</SelectItem>
                          <SelectItem value="speech_therapist">Fonoaudiólogo</SelectItem>
                          <SelectItem value="occupational_therapist">Terapeuta Ocupacional</SelectItem>
                          <SelectItem value="physiotherapist">Fisioterapeuta</SelectItem>
                          <SelectItem value="pedagogist">Pedagogo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Profissional</Label>
                      <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.user_id} value={employee.user_id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Unidade</Label>
                      <Select value={filterUnit} onValueChange={setFilterUnit}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as unidades</SelectItem>
                          <SelectItem value="madre">MADRE</SelectItem>
                          <SelectItem value="floresta">Floresta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Área Principal - Agendamentos */}
          <div className="xl:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Agendamentos - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : todaySchedules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum agendamento para esta data.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaySchedules.map((schedule) => (
                      <Card key={schedule.id} className="border-l-4 border-l-primary/30">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-foreground">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium text-muted-foreground">Horário:</span>
                                  <span className="font-semibold">
                                    {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })} - {format(new Date(schedule.end_time), 'HH:mm', { locale: ptBR })}
                                  </span>
                                </div>
                                <Badge variant={getStatusBadge(schedule.status).variant}>
                                  {getStatusBadge(schedule.status).text}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 text-foreground">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Paciente:</span>
                                <span className="font-semibold">{schedule.clients?.name || 'Não encontrado'}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-foreground">
                                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Profissional:</span>
                                 <span className="font-semibold">
                                   {schedule.profiles?.name || employees.find(emp => emp.user_id === schedule.employee_id)?.name || 'Não atribuído'}
                                 </span>
                              </div>
                            </div>

                            {/* Ações */}
                            <div className="flex items-center gap-2 ml-4">
                              {userProfile?.employee_role === 'receptionist' && (
                                <PatientPresenceButton 
                                  scheduleId={schedule.id}
                                  clientName={schedule.clients?.name || 'Não encontrado'}
                                  employeeId={schedule.employee_id}
                                  patientArrived={schedule.patient_arrived || false}
                                  arrivedAt={schedule.arrived_at}
                                  onPresenceUpdate={loadSchedules}
                                />
                              )}

                              {isAdmin && schedule.status === 'scheduled' && (
                                <Button
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingSchedule(schedule);
                                    setNewAppointment({
                                      client_id: schedule.client_id,
                                      employee_id: schedule.employee_id,
                                      title: schedule.title,
                                      start_time: format(new Date(schedule.start_time), "yyyy-MM-dd'T'HH:mm"),
                                      end_time: format(new Date(schedule.end_time), "yyyy-MM-dd'T'HH:mm"),
                                      notes: schedule.notes || '',
                                      unit: schedule.unit || 'madre'
                                    });
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}

                              {isAdmin && schedule.status !== 'cancelled' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleCancelAppointment(schedule.id)}>
                                        Confirmar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botão Flutuante para Móvel */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 xl:hidden"
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
                  unit: 'madre'
                });
              }}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
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