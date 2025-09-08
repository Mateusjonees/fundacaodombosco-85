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
import { Search, Eye, Calendar, FileText, Clock } from 'lucide-react';
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
    }
  }, [user]);

  const loadMyPatients = async () => {
    setLoading(true);
    try {
      // Get current user's profile to get their ID
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profileData) return;

      // Get all appointments for this professional
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('schedules')
        .select(`
          id,
          client_id,
          start_time,
          status,
          clients (
            id,
            name,
            phone,
            email,
            birth_date,
            is_active
          )
        `)
        .eq('employee_id', profileData.id)
        .eq('status', 'completed');

      if (appointmentsError) throw appointmentsError;

      // Group by client and calculate statistics
      const clientMap = new Map();
      appointmentsData?.forEach(appointment => {
        const client = appointment.clients;
        if (!client) return;

        if (!clientMap.has(client.id)) {
          clientMap.set(client.id, {
            ...client,
            total_appointments: 0,
            last_appointment: null,
            appointments: []
          });
        }

        const clientData = clientMap.get(client.id);
        clientData.total_appointments++;
        clientData.appointments.push(appointment);
        
        if (!clientData.last_appointment || 
            new Date(appointment.start_time) > new Date(clientData.last_appointment)) {
          clientData.last_appointment = appointment.start_time;
        }
      });

      // Get upcoming appointments for each client
      for (const [clientId, clientData] of clientMap) {
        const { data: upcomingData } = await supabase
          .from('schedules')
          .select('start_time')
          .eq('employee_id', profileData.id)
          .eq('client_id', clientId)
          .in('status', ['scheduled'])
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(1);

        if (upcomingData && upcomingData.length > 0) {
          clientData.next_appointment = upcomingData[0].start_time;
        }
      }

      const patientsArray = Array.from(clientMap.values());
      setPatients(patientsArray);
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
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profileData) return;

      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          clients (name)
        `)
        .eq('employee_id', profileData.id)
        .eq('status', 'scheduled')
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
                <p className="text-muted-foreground text-center py-8">
                  {searchTerm ? 'Nenhum paciente encontrado.' : 'Você ainda não possui pacientes atendidos.'}
                </p>
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
                            {format(new Date(appointment.appointment_date), "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <Clock className="h-4 w-4 text-muted-foreground ml-4" />
                          <span>{appointment.start_time} - {appointment.end_time}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Paciente: {appointment.clients?.name}
                        </div>
                        <Badge variant="outline" className="mt-2">
                          {appointment.type}
                        </Badge>
                      </div>
                      <Badge variant={appointment.status === 'confirmed' ? "default" : "secondary"}>
                        {appointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                      </Badge>
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