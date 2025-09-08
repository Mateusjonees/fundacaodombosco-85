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
import { Plus, Calendar as CalendarIcon, Clock, User, Edit, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  profiles?: { name: string; employee_role: string; department: string };
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

      // Apply role-based filtering - staff only see their assigned clients
      if (userProfile && !['director', 'coordinator_madre', 'coordinator_floresta'].includes(userProfile.employee_role)) {
        // For staff members, only show clients they have appointments with
        const { data: userSchedules } = await supabase
          .from('schedules')
          .select('client_id')
          .eq('employee_id', user?.id);
        
        const clientIds = [...new Set(userSchedules?.map(s => s.client_id) || [])];
        if (clientIds.length > 0) {
          query = query.in('id', clientIds);
        } else {
          // If no appointments, show no clients
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
          clients (name),
          profiles (name, employee_role, department)
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
      
      let filteredData = data || [];

      // Apply role and unit filters only for coordinators/directors
      if (userProfile && ['director', 'coordinator_madre', 'coordinator_floresta'].includes(userProfile.employee_role)) {
        // Filter by role
        if (filterRole !== 'all') {
          filteredData = filteredData.filter(schedule => 
            schedule.profiles?.employee_role === filterRole
          );
        }

        // Filter by unit
        if (filterUnit !== 'all') {
          filteredData = filteredData.filter(schedule => {
            if (filterUnit === 'madre') {
              return schedule.profiles?.department?.toLowerCase().includes('madre') || 
                     schedule.profiles?.employee_role === 'coordinator_madre';
            }
            if (filterUnit === 'floresta') {
              return schedule.profiles?.department?.toLowerCase().includes('floresta') || 
                     schedule.profiles?.employee_role === 'coordinator_floresta';
            }
            return true;
          });
        }
      }

      setSchedules(filteredData);
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
      const appointmentData = editingSchedule 
        ? { ...newAppointment, id: editingSchedule.id }
        : newAppointment;

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

  const handleStatusChange = async (scheduleId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status: newStatus })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Agendamento ${newStatus === 'confirmed' ? 'confirmado' : 
                                   newStatus === 'cancelled' ? 'cancelado' : 'atualizado'} com sucesso!`,
      });

      loadSchedules();
    } catch (error) {
      console.error('Error updating schedule status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do agendamento.",
      });
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setNewAppointment({
      client_id: schedule.client_id,
      employee_id: schedule.employee_id,
      title: schedule.title,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
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
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Agenda</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da esquerda - Calendário */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="rounded-md border"
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
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-green-800">Filtrar por Cargo:</Label>
                      <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="bg-white border-green-300">
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
                      <Label className="text-sm font-medium text-green-800">Ver agenda de:</Label>
                      <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                        <SelectTrigger className="bg-white border-green-300">
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
                      <Label className="text-sm font-medium text-green-800">Filtrar por Unidade:</Label>
                      <Select value={filterUnit} onValueChange={setFilterUnit}>
                        <SelectTrigger className="bg-white border-green-300">
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg" 
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
                  <Plus className="h-5 w-5 mr-2" />
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
                      <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {new Date(schedule.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})} - {new Date(schedule.end_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                            </span>
                            <Badge variant="outline">{schedule.title}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="h-3 w-3" />
                            <span>Cliente: {schedule.clients?.name || 'N/A'}</span>
                            <span>•</span>
                            <span>Profissional: {schedule.profiles?.name || 'N/A'}</span>
                          </div>
                          {schedule.notes && (
                            <p className="text-sm text-muted-foreground">{schedule.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(schedule.status)}>
                            {getStatusLabel(schedule.status)}
                          </Badge>
                          
                          {/* Botões de ação - apenas para diretores */}
                          {userProfile?.employee_role === 'director' && (
                            <div className="flex gap-1">
                              {schedule.status === 'scheduled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(schedule.id, 'confirmed')}
                                  title="Confirmar"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(schedule)}
                                title="Editar"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>

                              {schedule.status !== 'cancelled' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      title="Cancelar"
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja cancelar este agendamento?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Não</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleStatusChange(schedule.id, 'cancelled')}>
                                        Sim, Cancelar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
      </div>
    </div>
  );
}