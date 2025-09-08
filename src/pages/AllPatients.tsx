import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { Search, Eye, Calendar, FileText, Phone, Activity, Users, Building } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  status: string;
  created_at: string;
  last_appointment?: string;
  total_appointments?: number;
  assigned_employee?: string;
  employee_name?: string;
  department?: string;
}

export default function AllPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('todos');
  const [professionalFilter, setProfessionalFilter] = useState('todos');
  const [unitFilter, setUnitFilter] = useState('todos');
  const [employees, setEmployees] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getCurrentUserRole();
      loadEmployees();
      loadPatients();
    }
  }, [user]);

  const getCurrentUserRole = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('employee_role')
        .eq('user_id', user?.id)
        .single();
      
      setUserRole(profile?.employee_role || '');
      setCurrentUserId(user?.id || '');
    } catch (error) {
      console.error('Error getting user role:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_details')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadPatients = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          schedules (
            id,
            start_time,
            status,
            employee_id
          )
        `)
        .order('name');

      const { data: clientsData, error: clientsError } = await query;

      if (clientsError) throw clientsError;

      // Get employee details separately
      const { data: employeeData } = await supabase
        .from('employee_details')
        .select('user_id, name, department');

      const employeeMap = new Map(employeeData?.map(emp => [emp.user_id, emp]) || []);

      // Process the data to include appointment statistics
      let patientsWithStats = clientsData?.map(client => {
        const appointments = client.schedules || [];
        const completedAppointments = appointments.filter(apt => apt.status === 'completed');
        const lastAppointment = appointments
          .filter(apt => apt.status === 'completed')
          .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];

        // Get assigned employee info
        const latestSchedule = appointments[appointments.length - 1];
        const employeeInfo = latestSchedule?.employee_id ? employeeMap.get(latestSchedule.employee_id) : null;

        return {
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email,
          birth_date: client.birth_date,
          status: client.is_active ? 'active' : 'inactive',
          created_at: client.created_at,
          last_appointment: lastAppointment?.start_time,
          total_appointments: completedAppointments.length,
          assigned_employee: latestSchedule?.employee_id,
          employee_name: employeeInfo?.name,
          department: employeeInfo?.department
        };
      }) || [];

      // Apply role-based filtering for non-directors/coordinators
      if (userRole && !['director', 'coordinator_madre', 'coordinator_floresta'].includes(userRole)) {
        // Non-coordinators/directors only see their assigned patients
        patientsWithStats = patientsWithStats.filter(patient => 
          patient.assigned_employee === currentUserId
        );
      }

      setPatients(patientsWithStats);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os pacientes.",
      });
    } finally {
      setLoading(false);
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

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActivity = activityFilter === 'todos' || 
      (activityFilter === 'ativo' && patient.status === 'active') ||
      (activityFilter === 'inativo' && patient.status === 'inactive');
    
    const matchesProfessional = professionalFilter === 'todos' ||
      patient.assigned_employee === professionalFilter;
    
    const matchesUnit = unitFilter === 'todos' ||
      (unitFilter === 'madre' && patient.department === 'Unidade Madre') ||
      (unitFilter === 'floresta' && patient.department === 'Unidade Floresta');

    return matchesSearch && matchesActivity && matchesProfessional && matchesUnit;
  });

  const activePatients = filteredPatients.filter(p => p.status === 'active');
  const inactivePatients = filteredPatients.filter(p => p.status === 'inactive');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Todos os Pacientes</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
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
            <div className="text-2xl font-bold text-green-600">{activePatients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Inativos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{inactivePatients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Realizadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredPatients.reduce((sum, p) => sum + (p.total_appointments || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Only visible to coordinators and directors */}
      {['director', 'coordinator_madre', 'coordinator_floresta'].includes(userRole) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Activity className="h-4 w-4 text-green-500" />
              FILTRAR POR ATIVIDADE:
            </div>
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4 text-blue-500" />
              FILTRAR POR PROFISSIONAL:
            </div>
            <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.user_id} value={employee.user_id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building className="h-4 w-4 text-purple-500" />
              FILTRAR POR UNIDADE:
            </div>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Unidades</SelectItem>
                <SelectItem value="madre">Unidade Madre</SelectItem>
                <SelectItem value="floresta">Unidade Floresta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nome, CPF ou ID..."
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
              {searchTerm ? 'Nenhum paciente encontrado com o termo de busca.' : 'Nenhum paciente cadastrado.'}
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
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </div>
                        )}
                        {patient.email && (
                          <div className="text-sm text-muted-foreground">{patient.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.status === 'active' ? "default" : "secondary"}>
                        {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {patient.total_appointments || 0} consultas
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {patient.last_appointment 
                        ? new Date(patient.last_appointment).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Visualização",
                              description: "Abrindo detalhes do cliente...",
                            });
                            setTimeout(() => {
                              window.location.href = `/clients?view=${patient.id}`;
                            }, 500);
                          }}
                          title="Ver detalhes"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Agendamento",
                              description: "Redirecionando para a agenda...",
                            });
                            setTimeout(() => {
                              window.location.href = `/schedule?client=${patient.id}`;
                            }, 1000);
                          }}
                          title="Agendar consulta"
                        >
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
    </div>
  );
}