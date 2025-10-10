import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Bell, Plus, Calendar, MapPin, Users, Clock, Trash2, Edit, Eye, CheckCircle, XCircle, Filter } from 'lucide-react';

interface MeetingAlert {
  id: string;
  title: string;
  message: string;
  meeting_date: string;
  meeting_location?: string;
  meeting_room?: string;
  client_id?: string;
  created_by: string;
  created_at: string;
  participants: string[];
  is_active: boolean;
  status: 'scheduled' | 'completed' | 'cancelled';
  clients?: { name: string };
  profiles?: { name: string };
}

interface Employee {
  id: string;
  user_id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

export const MeetingAlertManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isDirector, hasAnyPermission } = usePermissions();
  const canManageMeetings = isDirector || hasAnyPermission(['manage_permissions', 'view_employees']);

  const [alerts, setAlerts] = useState<MeetingAlert[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<MeetingAlert | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    meeting_date: '',
    meeting_time: '',
    meeting_location: '',
    meeting_room: '',
    client_id: 'none', // Valor padrão válido
    participants: [] as string[]
  });

  useEffect(() => {
    if (canManageMeetings) {
      loadData();
    }
  }, [canManageMeetings, filterStatus, filterDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAlerts(),
        loadEmployees(),
        loadClients()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      let query = supabase
        .from('meeting_alerts')
        .select(`
          *,
          clients!meeting_alerts_client_id_fkey (name),
          profiles!meeting_alerts_created_by_fkey (name)
        `)
        .eq('is_active', true);

      // Apply filters
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterDate) {
        const startOfDay = new Date(filterDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filterDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.gte('meeting_date', startOfDay.toISOString()).lte('meeting_date', endOfDay.toISOString());
      }

      query = query.order('meeting_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setAlerts((data as any) || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, name')
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
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleCreateAlert = async () => {
    if (!newAlert.title || !newAlert.message || !newAlert.meeting_date || !newAlert.meeting_time) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    try {
      const meetingDateTime = new Date(`${newAlert.meeting_date}T${newAlert.meeting_time}`).toISOString();
      
      const { error } = await supabase
        .from('meeting_alerts')
        .insert([{
          title: newAlert.title,
          message: newAlert.message,
          meeting_date: meetingDateTime,
          meeting_location: newAlert.meeting_location,
          meeting_room: newAlert.meeting_room,
          client_id: newAlert.client_id === 'none' ? null : newAlert.client_id,
          created_by: user?.id,
          participants: newAlert.participants
        }]);

      if (error) throw error;

      // Create notifications for each participant
      if (newAlert.participants.length > 0) {
        const notifications = newAlert.participants.map(participantId => ({
          user_id: participantId,
          title: `Nova Reunião: ${newAlert.title}`,
          message: `${newAlert.message}\nData: ${new Date(meetingDateTime).toLocaleString('pt-BR')}\nLocal: ${newAlert.meeting_location || 'Não informado'}`,
          type: 'meeting'
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      toast({
        title: "Sucesso",
        description: "Alerta de reunião criado com sucesso!",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o alerta.",
      });
    }
  };

  const handleUpdateAlert = async () => {
    if (!selectedAlert) return;
    if (!newAlert.title || !newAlert.message || !newAlert.meeting_date || !newAlert.meeting_time) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    try {
      const meetingDateTime = new Date(`${newAlert.meeting_date}T${newAlert.meeting_time}`).toISOString();
      
      const { error } = await supabase
        .from('meeting_alerts')
        .update({
          title: newAlert.title,
          message: newAlert.message,
          meeting_date: meetingDateTime,
          meeting_location: newAlert.meeting_location,
          meeting_room: newAlert.meeting_room,
          client_id: newAlert.client_id === 'none' ? null : newAlert.client_id,
          participants: newAlert.participants
        })
        .eq('id', selectedAlert.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Reunião atualizada com sucesso!",
      });

      setIsEditDialogOpen(false);
      setSelectedAlert(null);
      resetForm();
      loadAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a reunião.",
      });
    }
  };

  const handleChangeStatus = async (alertId: string, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('meeting_alerts')
        .update({ status: newStatus })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Status alterado para ${newStatus === 'scheduled' ? 'Agendada' : newStatus === 'completed' ? 'Realizada' : 'Cancelada'}!`,
      });

      loadAlerts();
    } catch (error) {
      console.error('Error changing status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status.",
      });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Tem certeza que deseja excluir este alerta?')) return;

    try {
      const { error } = await supabase
        .from('meeting_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Alerta excluído com sucesso!",
      });

      loadAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o alerta.",
      });
    }
  };

  const openEditDialog = (alert: MeetingAlert) => {
    setSelectedAlert(alert);
    const date = new Date(alert.meeting_date);
    setNewAlert({
      title: alert.title,
      message: alert.message,
      meeting_date: date.toISOString().split('T')[0],
      meeting_time: date.toTimeString().slice(0, 5),
      meeting_location: alert.meeting_location || '',
      meeting_room: alert.meeting_room || '',
      client_id: alert.client_id || 'none',
      participants: alert.participants || []
    });
    setIsEditDialogOpen(true);
  };

  const openDetailsDialog = (alert: MeetingAlert) => {
    setSelectedAlert(alert);
    setIsDetailsDialogOpen(true);
  };

  const resetForm = () => {
    setNewAlert({
      title: '',
      message: '',
      meeting_date: '',
      meeting_time: '',
      meeting_location: '',
      meeting_room: '',
      client_id: 'none',
      participants: []
    });
    setSelectedAlert(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Agendada', variant: 'default' as const, icon: Calendar },
      completed: { label: 'Realizada', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const toggleParticipant = (employeeId: string) => {
    setNewAlert(prev => ({
      ...prev,
      participants: prev.participants.includes(employeeId)
        ? prev.participants.filter(id => id !== employeeId)
        : [...prev.participants, employeeId]
    }));
  };

  if (!canManageMeetings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">Acesso Negado</h3>
            <p className="text-sm text-muted-foreground">
              Apenas diretores e coordenadores podem gerenciar alertas de reunião.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Alertas de Reunião</h2>
          <p className="text-muted-foreground">
            Gerencie alertas e notificações para reuniões
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reunião
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Alerta de Reunião</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título da Reunião *</Label>
                  <Input
                    value={newAlert.title}
                    onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                    placeholder="Ex: Reunião de Equipe"
                  />
                </div>
                <div>
                  <Label>Paciente (Opcional)</Label>
                  <Select value={newAlert.client_id} onValueChange={(value) => setNewAlert({ ...newAlert, client_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum paciente</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data da Reunião *</Label>
                  <Input
                    type="date"
                    value={newAlert.meeting_date}
                    onChange={(e) => setNewAlert({ ...newAlert, meeting_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Horário *</Label>
                  <Input
                    type="time"
                    value={newAlert.meeting_time}
                    onChange={(e) => setNewAlert({ ...newAlert, meeting_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Local</Label>
                  <Input
                    value={newAlert.meeting_location}
                    onChange={(e) => setNewAlert({ ...newAlert, meeting_location: e.target.value })}
                    placeholder="Ex: Sala de Reuniões"
                  />
                </div>
                <div>
                  <Label>Sala</Label>
                  <Input
                    value={newAlert.meeting_room}
                    onChange={(e) => setNewAlert({ ...newAlert, meeting_room: e.target.value })}
                    placeholder="Ex: Sala 101"
                  />
                </div>
              </div>
              
              <div>
                <Label>Descrição/Agenda *</Label>
                <Textarea
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                  placeholder="Descreva a agenda da reunião..."
                />
              </div>

              <div>
                <Label>Participantes</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {employees.map(employee => (
                    <div key={employee.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newAlert.participants.includes(employee.user_id)}
                        onChange={() => toggleParticipant(employee.user_id)}
                        className="rounded"
                      />
                      <span className="text-sm">{employee.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {newAlert.participants.length} participantes selecionados
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAlert} disabled={loading}>
                  <Bell className="h-4 w-4 mr-2" />
                  Criar Alerta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="scheduled">Agendadas</SelectItem>
                  <SelectItem value="completed">Realizadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Data</Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilterStatus('all');
                setFilterDate('');
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {alerts.filter(alert => 
                new Date(alert.meeting_date).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas</CardTitle>
            <Bell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alerts.filter(alert => 
                new Date(alert.meeting_date) > new Date() && alert.status === 'scheduled'
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reuniões Agendadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando reuniões...
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma reunião agendada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map(alert => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{new Date(alert.meeting_date).toLocaleDateString('pt-BR')}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.meeting_date).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(alert.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">
                          {alert.meeting_location || 'Não informado'}
                          {alert.meeting_room && ` - ${alert.meeting_room}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.clients?.name || 'Nenhum'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {alert.participants.length} pessoas
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailsDialog(alert)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(alert)}
                          title="Editar"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Reunião</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Título da Reunião *</Label>
                <Input
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                  placeholder="Ex: Reunião de Equipe"
                />
              </div>
              <div>
                <Label>Paciente (Opcional)</Label>
                <Select value={newAlert.client_id} onValueChange={(value) => setNewAlert({ ...newAlert, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum paciente</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data da Reunião *</Label>
                <Input
                  type="date"
                  value={newAlert.meeting_date}
                  onChange={(e) => setNewAlert({ ...newAlert, meeting_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Horário *</Label>
                <Input
                  type="time"
                  value={newAlert.meeting_time}
                  onChange={(e) => setNewAlert({ ...newAlert, meeting_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Local</Label>
                <Input
                  value={newAlert.meeting_location}
                  onChange={(e) => setNewAlert({ ...newAlert, meeting_location: e.target.value })}
                  placeholder="Ex: Sala de Reuniões"
                />
              </div>
              <div>
                <Label>Sala</Label>
                <Input
                  value={newAlert.meeting_room}
                  onChange={(e) => setNewAlert({ ...newAlert, meeting_room: e.target.value })}
                  placeholder="Ex: Sala 101"
                />
              </div>
            </div>
            
            <div>
              <Label>Descrição/Agenda *</Label>
              <Textarea
                value={newAlert.message}
                onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                placeholder="Descreva a agenda da reunião..."
              />
            </div>

            <div>
              <Label>Participantes</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newAlert.participants.includes(employee.user_id)}
                      onChange={() => toggleParticipant(employee.user_id)}
                      className="rounded"
                    />
                    <span className="text-sm">{employee.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {newAlert.participants.length} participantes selecionados
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateAlert} disabled={loading}>
                <Edit className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Reunião</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Título</Label>
                  <p className="font-medium">{selectedAlert.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedAlert.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p>{new Date(selectedAlert.meeting_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Horário</Label>
                  <p>{new Date(selectedAlert.meeting_date).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Local</Label>
                  <p>{selectedAlert.meeting_location || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sala</Label>
                  <p>{selectedAlert.meeting_room || 'Não informado'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p>{selectedAlert.clients?.name || 'Nenhum'}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Descrição/Agenda</Label>
                <p className="whitespace-pre-wrap">{selectedAlert.message}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Participantes ({selectedAlert.participants.length})</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {employees
                    .filter(emp => selectedAlert.participants.includes(emp.user_id))
                    .map(emp => (
                      <Badge key={emp.id} variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {emp.name}
                      </Badge>
                    ))
                  }
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  {selectedAlert.status === 'scheduled' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          handleChangeStatus(selectedAlert.id, 'completed');
                          setIsDetailsDialogOpen(false);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marcar como Realizada
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          handleChangeStatus(selectedAlert.id, 'cancelled');
                          setIsDetailsDialogOpen(false);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar Reunião
                      </Button>
                    </>
                  )}
                </div>
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};