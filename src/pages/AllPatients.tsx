import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Calendar, FileText, Phone } from 'lucide-react';

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
}

export default function AllPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      // Get clients and their appointment count
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          schedules (
            id,
            appointment_date,
            status
          )
        `)
        .order('name');

      if (clientsError) throw clientsError;

      // Process the data to include appointment statistics
      const patientsWithStats = clientsData?.map(client => {
        const appointments = client.schedules || [];
        const completedAppointments = appointments.filter(apt => apt.status === 'completed');
        const lastAppointment = appointments
          .filter(apt => apt.status === 'completed')
          .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0];

        return {
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email,
          birth_date: client.birth_date,
          status: client.status,
          created_at: client.created_at,
          last_appointment: lastAppointment?.appointment_date,
          total_appointments: completedAppointments.length
        };
      }) || [];

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

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    </div>
  );
}