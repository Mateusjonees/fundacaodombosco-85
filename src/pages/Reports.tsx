import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { FileText, Download, Calendar, Users, Clock, TrendingUp, User, Award } from 'lucide-react';

interface EmployeeStats {
  employee: any;
  totalAppointments: number;
  completedAppointments: number;
  totalHours: number;
  uniqueClients: number;
  avgAppointmentDuration: number;
  monthlyStats: any[];
  clientsList: any[];
  recentAppointments: any[];
}

export default function Reports() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      generateEmployeeReport();
    }
  }, [selectedEmployee, dateRange]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, employee_role, department, phone')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
      
      // Auto-select current user if they're in the list
      const currentUserProfile = data?.find(emp => emp.user_id === user?.id);
      if (currentUserProfile) {
        setSelectedEmployee(currentUserProfile.user_id);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
      });
    }
  };

  const generateEmployeeReport = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      const employee = employees.find(emp => emp.user_id === selectedEmployee);
      if (!employee) return;

      // Load appointments for the employee
      const { data: appointments, error: appointmentsError } = await supabase
        .from('schedules')
        .select(`
          id, title, start_time, end_time, status, description, client_id,
          clients:client_id (id, name, unit)
        `)
        .eq('employee_id', selectedEmployee)
        .gte('start_time', `${dateRange.start}T00:00:00`)
        .lte('start_time', `${dateRange.end}T23:59:59`)
        .order('start_time', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Load client assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('client_assignments')
        .select(`
          id, client_id, assigned_at,
          clients:client_id (id, name, unit, diagnosis)
        `)
        .eq('employee_id', selectedEmployee)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      // Calculate statistics
      const totalAppointments = appointments?.length || 0;
      const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
      
      // Calculate total hours (assuming each appointment is the difference between start and end time)
      const totalHours = appointments?.reduce((sum, apt) => {
        const start = new Date(apt.start_time);
        const end = new Date(apt.end_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) || 0;

      const uniqueClients = new Set(appointments?.map(a => a.client_id)).size;
      const avgAppointmentDuration = totalAppointments > 0 ? totalHours / totalAppointments : 0;

      // Monthly statistics
      const monthlyStats = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthAppointments = appointments?.filter(a => {
          const date = new Date(a.start_time);
          return date.getMonth() + 1 === month && date.getFullYear() === new Date().getFullYear();
        }) || [];

        const monthHours = monthAppointments.reduce((sum, apt) => {
          const start = new Date(apt.start_time);
          const end = new Date(apt.end_time);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

        return {
          month: new Date(2025, i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
          appointments: monthAppointments.length,
          hours: monthHours,
          completed: monthAppointments.filter(a => a.status === 'completed').length
        };
      });

      // Get unique clients list with appointment count
      const clientsMap = new Map();
      appointments?.forEach(apt => {
        if (apt.clients) {
          const clientId = apt.clients.id;
          if (clientsMap.has(clientId)) {
            clientsMap.get(clientId).appointmentCount++;
          } else {
            clientsMap.set(clientId, {
              ...apt.clients,
              appointmentCount: 1
            });
          }
        }
      });

      const clientsList = Array.from(clientsMap.values());

      setEmployeeStats({
        employee,
        totalAppointments,
        completedAppointments,
        totalHours: Math.round(totalHours * 100) / 100,
        uniqueClients,
        avgAppointmentDuration: Math.round(avgAppointmentDuration * 100) / 100,
        monthlyStats,
        clientsList,
        recentAppointments: appointments?.slice(0, 10) || []
      });

    } catch (error) {
      console.error('Error generating employee report:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o relatório do funcionário.",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportEmployeeReport = () => {
    if (!employeeStats) return;

    const reportContent = `
RELATÓRIO DETALHADO DO FUNCIONÁRIO
==================================

DADOS PESSOAIS
===============
Nome: ${employeeStats.employee.name}
Cargo: ${employeeStats.employee.employee_role}
Departamento: ${employeeStats.employee.department || 'Não informado'}
Telefone: ${employeeStats.employee.phone || 'Não informado'}
ID do Funcionário: ${employeeStats.employee.user_id}

PERÍODO DO RELATÓRIO
===================
Data Início: ${new Date(dateRange.start).toLocaleDateString('pt-BR')}
Data Fim: ${new Date(dateRange.end).toLocaleDateString('pt-BR')}

ESTATÍSTICAS GERAIS
==================
Total de Atendimentos: ${employeeStats.totalAppointments}
Atendimentos Concluídos: ${employeeStats.completedAppointments}
Taxa de Conclusão: ${employeeStats.totalAppointments > 0 ? ((employeeStats.completedAppointments / employeeStats.totalAppointments) * 100).toFixed(1) : 0}%

HORAS TRABALHADAS
================
Total de Horas: ${employeeStats.totalHours} horas
Duração Média por Atendimento: ${employeeStats.avgAppointmentDuration} horas
Horas por Mês (Média): ${(employeeStats.totalHours / 12).toFixed(2)} horas

CLIENTES ATENDIDOS
=================
Total de Clientes Únicos: ${employeeStats.uniqueClients}
Atendimentos por Cliente (Média): ${employeeStats.uniqueClients > 0 ? (employeeStats.totalAppointments / employeeStats.uniqueClients).toFixed(1) : 0}

LISTA DE CLIENTES
================
${employeeStats.clientsList.map((client, index) => `
${index + 1}. ${client.name}
   - Unidade: ${client.unit === 'madre' ? 'Clínica Social (Madre)' : 'Neuro (Floresta)'}
   - Total de Atendimentos: ${client.appointmentCount}
`).join('\n')}

ESTATÍSTICAS MENSAIS
===================
${employeeStats.monthlyStats.map(month => `
${month.month}: ${month.appointments} atendimentos, ${month.hours.toFixed(1)} horas, ${month.completed} concluídos
`).join('')}

ÚLTIMOS ATENDIMENTOS
===================
${employeeStats.recentAppointments.slice(0, 10).map((apt, index) => `
${index + 1}. ${apt.title}
   Data/Hora: ${new Date(apt.start_time).toLocaleString('pt-BR')}
   Cliente: ${apt.clients?.name || 'N/A'}
   Status: ${apt.status === 'completed' ? 'Concluído' : apt.status}
   ${apt.description ? `Descrição: ${apt.description}` : ''}
`).join('\n')}

INDICADORES DE PERFORMANCE
=========================
- Produtividade: ${(employeeStats.totalHours / ((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24 * 30))).toFixed(2)} horas/mês
- Eficiência: ${((employeeStats.completedAppointments / employeeStats.totalAppointments) * 100).toFixed(1)}% de conclusão
- Fidelização: ${employeeStats.uniqueClients > 0 ? (employeeStats.totalAppointments / employeeStats.uniqueClients).toFixed(1) : 0} atendimentos por cliente

Relatório gerado em: ${new Date().toLocaleString('pt-BR')}
Gerado por: Sistema de Gestão Clínica
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-funcionario-${employeeStats.employee.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório Exportado",
      description: "O relatório detalhado do funcionário foi baixado com sucesso!",
    });
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios de Funcionários</h1>
        {employeeStats && (
          <Button onClick={exportEmployeeReport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.name} - {employee.employee_role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Carregando relatório...</p>
          </CardContent>
        </Card>
      )}

      {!loading && employeeStats && (
        <>
          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{employeeStats.employee.name}</h3>
                  <p className="text-muted-foreground">{employeeStats.employee.employee_role}</p>
                  {employeeStats.employee.department && (
                    <p className="text-sm">Departamento: {employeeStats.employee.department}</p>
                  )}
                </div>
                <div>
                  {employeeStats.employee.phone && (
                    <p className="text-sm">Telefone: {employeeStats.employee.phone}</p>
                  )}
                  <p className="text-sm">Período: {new Date(dateRange.start).toLocaleDateString('pt-BR')} - {new Date(dateRange.end).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Atendimentos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employeeStats.totalAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {employeeStats.completedAppointments} concluídos ({employeeStats.totalAppointments > 0 ? ((employeeStats.completedAppointments / employeeStats.totalAppointments) * 100).toFixed(1) : 0}%)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Trabalhadas</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employeeStats.totalHours}h</div>
                <p className="text-xs text-muted-foreground">
                  Média: {employeeStats.avgAppointmentDuration}h por atendimento
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employeeStats.uniqueClients}</div>
                <p className="text-xs text-muted-foreground">
                  {employeeStats.uniqueClients > 0 ? (employeeStats.totalAppointments / employeeStats.uniqueClients).toFixed(1) : 0} atendimentos/cliente
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employeeStats.totalAppointments > 0 ? ((employeeStats.completedAppointments / employeeStats.totalAppointments) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Taxa de conclusão
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={employeeStats.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="appointments" fill="hsl(var(--primary))" name="Total" />
                    <Bar dataKey="completed" fill="hsl(var(--secondary))" name="Concluídos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horas por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={employeeStats.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}h`, 'Horas']} />
                    <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Clients List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Atendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {employeeStats.clientsList.map((client) => (
                    <div key={client.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {client.unit === 'madre' ? 'Clínica Social (Madre)' : 'Neuro (Floresta)'}
                        </div>
                      </div>
                      <Badge variant="outline">{client.appointmentCount} atendimentos</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimos Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {employeeStats.recentAppointments.map((appointment) => (
                    <div key={appointment.id} className="border-l-4 border-primary pl-4 py-2">
                      <div className="font-medium">{appointment.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Cliente: {appointment.clients?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(appointment.start_time).toLocaleString('pt-BR')}
                      </div>
                      <Badge 
                        variant={appointment.status === 'completed' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {appointment.status === 'completed' ? 'Concluído' : appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!loading && !employeeStats && selectedEmployee && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum dado encontrado para o período selecionado.</p>
          </CardContent>
        </Card>
      )}

      {!selectedEmployee && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Selecione um funcionário para gerar o relatório.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}