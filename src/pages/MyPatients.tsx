import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Calendar, FileText, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MyPatient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  is_active: boolean;
  last_appointment?: string;
  next_appointment?: string;
  total_appointments: number;
}

export default function MyPatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<MyPatient[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadMyPatients();
      loadUpcomingAppointments();
      
      // Auto-refresh every 30 seconds to show new assignments and appointments
      const interval = setInterval(() => {
        loadMyPatients();
        loadUpcomingAppointments();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadMyPatients = async () => {
    setLoading(true);
    try {
      // Get all clients assigned to this professional through client_assignments
      const { data: assignedClients, error: assignmentError } = await supabase
        .from('client_assignments')
        .select(`
          clients!inner (
            id,
            name,
            phone,
            email,
            birth_date,
            is_active
          )
        `)
        .eq('employee_id', user?.id)
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;

      // Get appointment statistics for each client
      const patientsWithStats = await Promise.all(
        (assignedClients || []).map(async (assignment) => {
          const client = assignment.clients;
          
          // Get all appointments for this client with this professional
          const { data: appointments, error: appointmentsError } = await supabase
            .from('schedules')
            .select('id, start_time, status')
            .eq('employee_id', user?.id)
            .eq('client_id', client.id)
            .order('start_time', { ascending: false });

          if (appointmentsError) {
            console.error('Error loading appointments for client:', client.id, appointmentsError);
            return {
              ...client,
              total_appointments: 0,
              last_appointment: null,
              next_appointment: null
            };
          }

          const totalAppointments = appointments?.length || 0;
          const completedAppointments = appointments?.filter(a => a.status === 'completed') || [];
          const lastAppointment = completedAppointments.length > 0 ? completedAppointments[0].start_time : null;

          // Get next appointment
          const upcomingAppointments = appointments?.filter(a => 
            a.status === 'scheduled' && new Date(a.start_time) > new Date()
          ) || [];
          
          const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0].start_time : null;

          return {
            ...client,
            total_appointments: totalAppointments,
            last_appointment: lastAppointment,
            next_appointment: nextAppointment
          };
        })
      );

      setPatients(patientsWithStats);
    } catch (error) {
      console.error('Error loading my patients:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar seus pacientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          clients (name)
        `)
        .eq('employee_id', user?.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) throw error;
      setUpcomingAppointments(data || []);
    } catch (error) {
      console.error('Error loading upcoming appointments:', error);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meus Pacientes</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 animate-pulse" />
          <span>Atualização automática ativa</span>
        </div>
      </div>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patients">Meus Pacientes</TabsTrigger>
          <TabsTrigger value="appointments">Próximos Atendimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meus Pacientes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredPatients.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 <div className="text-2xl font-bold text-green-600">
                   {filteredPatients.filter(p => p.is_active).length}
                 </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredPatients.reduce((sum, p) => sum + p.total_appointments, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Pacientes</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Carregando pacientes...</p>
              ) : filteredPatients.length === 0 ? (
                 <div className="text-muted-foreground text-center py-8">
                   {searchTerm ? 'Nenhum paciente encontrado.' : 'Você ainda não possui pacientes vinculados. Quando você for designado para atender um cliente ou criar um agendamento, ele aparecerá aqui automaticamente.'}
                 </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Consultas</TableHead>
                      <TableHead>Última Consulta</TableHead>
                      <TableHead>Próxima Consulta</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>
                          {patient.birth_date ? `${calculateAge(patient.birth_date)} anos` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {patient.phone && (
                              <div className="text-sm">{patient.phone}</div>
                            )}
                            {patient.email && (
                              <div className="text-sm text-muted-foreground">{patient.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                         <Badge variant={patient.is_active ? "default" : "secondary"}>
                            {patient.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {patient.total_appointments} consultas
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {patient.last_appointment 
                            ? new Date(patient.last_appointment).toLocaleDateString('pt-BR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {patient.next_appointment ? (
                            <Badge variant="outline">
                              {new Date(patient.next_appointment).toLocaleDateString('pt-BR')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Não agendada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Calendar className="h-3 w-3" />
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
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Próximos Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum atendimento agendado.
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(appointment.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          <strong>Paciente:</strong> {appointment.clients?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>Tipo:</strong> {appointment.title || 'Consulta'}
                        </div>
                        {appointment.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <strong>Observações:</strong> {appointment.description}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={
                          appointment.status === 'confirmed' ? "default" : 
                          appointment.status === 'scheduled' ? "secondary" : "outline"
                        }>
                          {appointment.status === 'confirmed' ? 'Confirmado' : 
                           appointment.status === 'scheduled' ? 'Agendado' : 
                           appointment.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}