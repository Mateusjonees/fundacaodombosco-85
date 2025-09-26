import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { FileText, Users, Calendar, Star, TrendingUp, Download, Filter, Search, BarChart3, Clock, Shield } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmployeeReport {
  id: string;
  employee_id: string;
  client_id: string;
  session_date: string;
  session_type: string;
  session_duration?: number;
  effort_rating?: number;
  quality_rating?: number;
  patient_cooperation?: number;
  goal_achievement?: number;
  session_objectives?: string;
  techniques_used?: string;
  patient_response?: string;
  professional_notes?: string;
  materials_cost: number;
  clients?: { name: string };
  profiles?: { name: string };
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  employee_role: string;
}

export default function Reports() {
  const [attendanceReports, setAttendanceReports] = useState<any[]>([]);
  const [employeeReports, setEmployeeReports] = useState<EmployeeReport[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [sessionType, setSessionType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { 
    canViewReports, 
    canConfigureReports, 
    isDirector, 
    userRole, 
    loading: roleLoading 
  } = useRolePermissions();
  const { toast } = useToast();

  // Debug: Log user info
  useEffect(() => {
    console.log('Reports Debug:', {
      user: user?.id,
      userRole,
      canViewReports: canViewReports(),
      isDirector: isDirector(),
      roleLoading
    });
  }, [user, userRole, roleLoading]);

  useEffect(() => {
    // Se ainda está carregando roles, aguarde
    if (roleLoading) {
      console.log('Still loading user role...');
      return;
    }

  // Apenas diretores podem acessar relatórios
  if (userRole !== 'director') {
    console.log('No permission to view reports - directors only');
    toast({
      variant: "destructive",
      title: "Acesso Restrito",
      description: "Apenas diretores têm acesso aos relatórios do sistema."
    });
    return;
  }

  console.log('Director detected, loading reports...');
  loadEmployees();
  loadClients();
  loadAttendanceReports();
  loadEmployeeReports();
    
    console.log('Loading reports data...');
    loadEmployees();
    loadClients();
    loadAttendanceReports();
    loadEmployeeReports();
  }, [selectedEmployee, selectedClient, selectedUnit, dateFrom, dateTo, selectedMonth, sessionType, roleLoading, userRole]);

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

  const loadAttendanceReports = async () => {
    try {
      let query = supabase
        .from('attendance_reports')
        .select(`
          *,
          clients!attendance_reports_client_id_fkey(name),
          professional_name,
          patient_name
        `)
        .order('start_time', { ascending: false });

      // Aplicar filtros
      if (selectedEmployee !== 'all') {
        query = query.eq('employee_id', selectedEmployee);
      }
      
      if (selectedClient !== 'all') {
        query = query.eq('client_id', selectedClient);
      }
      
      if (dateFrom) {
        query = query.gte('start_time', dateFrom);
      }
      
      if (dateTo) {
        query = query.lte('start_time', dateTo + 'T23:59:59');
      }
      
      if (selectedMonth && !dateFrom && !dateTo) {
        const monthStart = startOfMonth(parseISO(selectedMonth + '-01'));
        const monthEnd = endOfMonth(parseISO(selectedMonth + '-01'));
        query = query.gte('start_time', format(monthStart, 'yyyy-MM-dd'))
                    .lte('start_time', format(monthEnd, 'yyyy-MM-dd') + 'T23:59:59');
      }
      
      if (sessionType !== 'all') {
        query = query.eq('attendance_type', sessionType);
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;
      
      // Mapeamos os dados para incluir os nomes dos professionals
      const reportsWithNames = await Promise.all((data || []).map(async (report) => {
        if (!report.professional_name) {
          // Buscar nome do profissional usando nossa função helper
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', report.employee_id)
            .single();
          
          report.professional_name = profileData?.name || 'Nome não encontrado';
        }
        
        return {
          ...report,
          profiles: { name: report.professional_name },
          clients: { name: report.patient_name || report.clients?.name }
        };
      }));
      
      setAttendanceReports(reportsWithNames);
    } catch (error) {
      console.error('Error loading attendance reports:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os relatórios de atendimento."
      });
    }
  };

  const loadEmployees = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .not('employee_role', 'is', null)
        .order('name');

      // Filtrar por unidade se selecionado
      if (selectedUnit !== 'all') {
        query = query.eq('unit', selectedUnit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadEmployeeReports = async () => {
    try {
      let query = supabase
        .from('employee_reports')
        .select(`
          *,
          clients!employee_reports_client_id_fkey(name)
        `)
        .order('session_date', { ascending: false })
        .limit(100);

      if (selectedEmployee !== 'all') {
        query = query.eq('employee_id', selectedEmployee);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Buscar nomes dos profissionais para cada relatório
      const reportsWithNames = await Promise.all((data || []).map(async (report) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', report.employee_id)
          .single();
        
        return {
          ...report,
          profiles: { name: profileData?.name || 'Nome não encontrado' }
        };
      }));
      
      setEmployeeReports(reportsWithNames);
    } catch (error) {
      console.error('Error loading employee reports:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os relatórios."
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Data', 'Funcionário', 'Cliente', 'Tipo', 'Duração', 'Qualidade', 'Objetivos', 'Materiais', 'Valor'].join(','),
      ...attendanceReports.map(report => [
        format(new Date(report.start_time), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        report.profiles?.name || '',
        report.clients?.name || '',
        report.attendance_type || '',
        report.session_duration ? `${report.session_duration} min` : '',
        report.quality_rating || '',
        report.techniques_used || '',
        Array.isArray(report.materials_used) ? 
          report.materials_used.map((m: any) => `${m.name} (${m.quantity})`).join('; ') : '',
        report.amount_charged ? `R$ ${report.amount_charged.toFixed(2)}` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_atendimentos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSelectedEmployee('all');
    setSelectedClient('all');
    setSelectedUnit('all');
    setDateFrom('');
    setDateTo('');
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
    setSessionType('all');
  };

  const getTotalSessions = () => attendanceReports.length;
  const getTotalRevenue = () => attendanceReports.reduce((sum, report) => sum + (report.amount_charged || 0), 0);
  const getAverageDuration = () => {
    const durationsWithValues = attendanceReports.filter(r => r.session_duration && r.session_duration > 0);
    if (durationsWithValues.length === 0) return 0;
    return durationsWithValues.reduce((sum, r) => sum + (r.session_duration || 0), 0) / durationsWithValues.length;
  };
  const getUniqueClients = () => new Set(attendanceReports.map(r => r.client_id)).size;

  const getAverageRating = (reports: EmployeeReport[], field: string) => {
    const ratingsWithValues = reports.filter(r => r[field] && r[field] > 0);
    if (ratingsWithValues.length === 0) return 0;
    return ratingsWithValues.reduce((sum, r) => sum + (r[field] || 0), 0) / ratingsWithValues.length;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-muted-foreground">-</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading || roleLoading) {
    return <div className="p-6">Carregando relatórios...</div>;
  }

  // Apenas diretores podem acessar relatórios
  if (userRole !== 'director') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Acesso restrito a diretores</p>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios de Atendimento</h1>
        <div className="flex gap-2">
          {canConfigureReports?.() && (
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
          <Button onClick={exportToCSV} disabled={attendanceReports.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Aviso sobre geração automática de relatórios */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <BarChart3 className="h-5 w-5" />
            <p className="text-sm font-medium">
              <strong>Novo!</strong> Os relatórios de funcionários agora são gerados automaticamente quando você completa um atendimento. 
              Isso garante maior controle e rastreabilidade das atividades.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div>
              <Label>Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cliente</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Unidade</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  <SelectItem value="madre">MADRE</SelectItem>
                  <SelectItem value="floresta">Floresta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Atendimento</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Consulta">Consulta</SelectItem>
                  <SelectItem value="Terapia">Terapia</SelectItem>
                  <SelectItem value="Avaliação">Avaliação</SelectItem>
                  <SelectItem value="Fonoaudiologia">Fonoaudiologia</SelectItem>
                  <SelectItem value="Psicologia">Psicologia</SelectItem>
                  <SelectItem value="Musicoterapia">Musicoterapia</SelectItem>
                  <SelectItem value="Fisioterapia">Fisioterapia</SelectItem>
                  <SelectItem value="Nutrição">Nutrição</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mês</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div>
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label>Data Final</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          
          {/* Resumo dos filtros */}
          {(selectedEmployee !== 'all' || selectedClient !== 'all' || selectedUnit !== 'all' || dateFrom || dateTo || sessionType !== 'all') && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">Filtros aplicados:</p>
              <div className="flex flex-wrap gap-2">
                {selectedEmployee !== 'all' && (
                  <Badge variant="outline">
                    Funcionário: {employees.find(e => e.user_id === selectedEmployee)?.name}
                  </Badge>
                )}
                {selectedClient !== 'all' && (
                  <Badge variant="outline">
                    Cliente: {clients.find(c => c.id === selectedClient)?.name}
                  </Badge>
                )}
                {selectedUnit !== 'all' && (
                  <Badge variant="outline">
                    Unidade: {selectedUnit === 'madre' ? 'MADRE' : 'Floresta'}
                  </Badge>
                )}
                {sessionType !== 'all' && (
                  <Badge variant="outline">Tipo: {sessionType}</Badge>
                )}
                {dateFrom && (
                  <Badge variant="outline">De: {format(new Date(dateFrom), 'dd/MM/yyyy')}</Badge>
                )}
                {dateTo && (
                  <Badge variant="outline">Até: {format(new Date(dateTo), 'dd/MM/yyyy')}</Badge>
                )}
                <Badge variant="secondary">{attendanceReports.length} atendimentos</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalSessions()}</div>
            <p className="text-xs text-muted-foreground">
              Atendimentos {dateFrom || dateTo ? 'no período' : 'registrados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUniqueClients()}</div>
            <p className="text-xs text-muted-foreground">Clientes atendidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(getAverageDuration())} min
            </div>
            <p className="text-xs text-muted-foreground">Por atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {getTotalRevenue().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateFrom || dateTo ? 'No período' : 'Total registrado'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Relatórios de Atendimento</TabsTrigger>
          <TabsTrigger value="sessions">Sessões Detalhadas</TabsTrigger>
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Completos de Atendimento</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visão completa dos atendimentos realizados com todas as informações registradas
              </p>
            </CardHeader>
            <CardContent>
              {attendanceReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum atendimento encontrado com os filtros aplicados.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Objetivos</TableHead>
                      <TableHead>Materiais</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {format(new Date(report.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(report.start_time), 'HH:mm', { locale: ptBR })} - {' '}
                              {format(new Date(report.end_time), 'HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{report.profiles?.name || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{report.clients?.name || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.attendance_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {report.session_duration ? `${report.session_duration} min` : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={report.techniques_used || ''}>
                            {report.techniques_used || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {Array.isArray(report.materials_used) && report.materials_used.length > 0 ? (
                              <div className="space-y-1">
                                {report.materials_used.slice(0, 2).map((material: any, idx: number) => (
                                  <div key={idx} className="text-xs">
                                    {material.name} ({material.quantity})
                                  </div>
                                ))}
                                {report.materials_used.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{report.materials_used.length - 2} mais
                                  </div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-green-600">
                            {report.amount_charged ? `R$ ${report.amount_charged.toFixed(2)}` : '-'}
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

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações por Critério</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Esforço</span>
                  <div className="flex items-center gap-2">
                    {renderStars(getAverageRating(employeeReports, 'effort_rating'))}
                    <span className="text-sm text-muted-foreground">
                      ({getAverageRating(employeeReports, 'effort_rating').toFixed(1)})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Qualidade</span>
                  <div className="flex items-center gap-2">
                    {renderStars(getAverageRating(employeeReports, 'quality_rating'))}
                    <span className="text-sm text-muted-foreground">
                      ({getAverageRating(employeeReports, 'quality_rating').toFixed(1)})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cooperação do Paciente</span>
                  <div className="flex items-center gap-2">
                    {renderStars(getAverageRating(employeeReports, 'patient_cooperation'))}
                    <span className="text-sm text-muted-foreground">
                      ({getAverageRating(employeeReports, 'patient_cooperation').toFixed(1)})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Alcance de Objetivos</span>
                  <div className="flex items-center gap-2">
                    {renderStars(getAverageRating(employeeReports, 'goal_achievement'))}
                    <span className="text-sm text-muted-foreground">
                      ({getAverageRating(employeeReports, 'goal_achievement').toFixed(1)})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total de Clientes Atendidos</span>
                  <span className="font-semibold">
                    {new Set(employeeReports.map(r => r.client_id)).size}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sessões este Mês</span>
                  <span className="font-semibold">
                    {employeeReports.filter(r => 
                      new Date(r.session_date).getMonth() === new Date().getMonth()
                    ).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tempo Total de Atendimento</span>
                  <span className="font-semibold">
                    {Math.round(
                      employeeReports.reduce((sum, r) => sum + (r.session_duration || 0), 0) / 60
                    )} horas
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Uso de Materiais por Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo de Sessão</TableHead>
                    <TableHead>Custo de Materiais</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeReports
                    .filter(report => report.materials_cost && report.materials_cost > 0)
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {format(new Date(report.session_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{report.profiles?.name}</TableCell>
                        <TableCell>{report.clients?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.session_type}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {report.materials_cost.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={report.professional_notes || ''}>
                            {report.professional_notes || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}