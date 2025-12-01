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
import { useCustomPermissions } from '@/hooks/useCustomPermissions';
import { FileText, Users, Calendar, Star, TrendingUp, Download, Filter, Search, BarChart3, Clock, Shield, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Combobox } from '@/components/ui/combobox';
import { DeleteFinancialRecordsDialog } from '@/components/DeleteFinancialRecordsDialog';

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
  const [isDeleteFinancialDialogOpen, setIsDeleteFinancialDialogOpen] = useState(false);
  const { user } = useAuth();
  const { 
    canViewReports, 
    canConfigureReports, 
    isDirector, 
    userRole, 
    loading: roleLoading 
  } = useRolePermissions();
  const customPermissions = useCustomPermissions();
  const { toast } = useToast();

  // Determinar a unidade do coordenador
  const coordinatorUnit = userRole === 'coordinator_madre' ? 'madre' : 
                         userRole === 'coordinator_floresta' ? 'floresta' : null;

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
    if (roleLoading || customPermissions.loading) return;

    const canAccessReports = userRole === 'director' || 
                            userRole === 'coordinator_madre' || 
                            userRole === 'coordinator_floresta' ||
                            customPermissions.hasPermission('view_reports');
    
    if (!canAccessReports) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Acesso Restrito",
        description: "Você não tem permissão para acessar os relatórios."
      });
      return;
    }

    if (coordinatorUnit && selectedUnit === 'all') {
      setSelectedUnit(coordinatorUnit);
    }

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadEmployees(),
          loadClients(),
          loadAttendanceReports(),
          loadEmployeeReports()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedEmployee, selectedClient, selectedUnit, dateFrom, dateTo, selectedMonth, sessionType, roleLoading, userRole, customPermissions.loading]);

  const loadClients = async () => {
    try {
      let query = supabase
        .from('clients')
        .select('id, name, unit')
        .eq('is_active', true);

      // Aplicar filtro de unidade baseado no role
      if (coordinatorUnit) {
        // Coordenadores veem apenas sua unidade
        query = query.eq('unit', coordinatorUnit);
      } else if (selectedUnit !== 'all') {
        // Diretores podem filtrar por unidade escolhida
        query = query.eq('unit', selectedUnit);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    }
  };

  const loadAttendanceReports = async () => {
    try {
      let query = supabase
        .from('attendance_reports')
        .select(`
          *,
          clients!attendance_reports_client_id_fkey(name, unit)
        `)
        .order('start_time', { ascending: false });

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

      const { data, error } = await query.limit(100);

      if (error) throw error;
      
      let filteredData = data || [];
      if (coordinatorUnit) {
        filteredData = filteredData.filter(report => 
          report.clients?.unit === coordinatorUnit
        );
      } else if (selectedUnit !== 'all') {
        filteredData = filteredData.filter(report => 
          report.clients?.unit === selectedUnit
        );
      }
      
      // Buscar todos os profiles de uma vez
      const employeeIds = [...new Set(filteredData.map(r => r.employee_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', employeeIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.name]) || []);
      
      const reportsWithNames = filteredData.map(report => ({
        ...report,
        profiles: { name: profilesMap.get(report.employee_id) || report.professional_name || 'Nome não encontrado' },
        clients: { name: report.patient_name || report.clients?.name }
      }));
      
      setAttendanceReports(reportsWithNames);
    } catch (error) {
      console.error('Error loading attendance reports:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os relatórios de atendimento."
      });
      setAttendanceReports([]);
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
      setEmployees([]);
    }
  };

  const loadEmployeeReports = async () => {
    try {
      let query = supabase
        .from('employee_reports')
        .select(`
          *,
          clients!employee_reports_client_id_fkey(name, unit)
        `)
        .order('session_date', { ascending: false })
        .limit(50);

      if (selectedEmployee !== 'all') {
        query = query.eq('employee_id', selectedEmployee);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredData = data || [];
      if (coordinatorUnit) {
        filteredData = filteredData.filter(report => 
          report.clients?.unit === coordinatorUnit
        );
      } else if (selectedUnit !== 'all') {
        filteredData = filteredData.filter(report => 
          report.clients?.unit === selectedUnit
        );
      }
      
      // Buscar todos os profiles de uma vez
      const employeeIds = [...new Set(filteredData.map(r => r.employee_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', employeeIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.name]) || []);
      
      const reportsWithNames = filteredData.map(report => ({
        ...report,
        profiles: { name: profilesMap.get(report.employee_id) || 'Nome não encontrado' }
      }));
      
      setEmployeeReports(reportsWithNames);
    } catch (error) {
      console.error('Error loading employee reports:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os relatórios."
      });
      setEmployeeReports([]);
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

  // Verificar se tem permissão para acessar
  const canAccessReports = userRole === 'director' || 
                          userRole === 'coordinator_madre' || 
                          userRole === 'coordinator_floresta';
  
  if (!canAccessReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Acesso restrito a coordenadores e diretores</p>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios de Atendimento</h1>
        <div className="flex gap-2">
          {isDirector() && (
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteFinancialDialogOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Registros Financeiros
            </Button>
          )}
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
            <Search className="h-5 w-5" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Primeira linha: Funcionário, Paciente, Unidade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Funcionário</Label>
                <Combobox
                  options={[
                    { value: "all", label: "Todos os funcionários" },
                    ...employees.map(employee => ({
                      value: employee.user_id,
                      label: employee.name
                    }))
                  ]}
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                  placeholder="Buscar funcionário..."
                  searchPlaceholder="Digite o nome do funcionário..."
                  emptyMessage="Nenhum funcionário encontrado."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Paciente</Label>
                <Combobox
                  options={[
                    { value: "all", label: "Todos os pacientes" },
                    ...clients.map(client => ({
                      value: client.id,
                      label: client.name
                    }))
                  ]}
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                  placeholder="Buscar paciente..."
                  searchPlaceholder="Digite o nome do paciente..."
                  emptyMessage="Nenhum paciente encontrado."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Unidade</Label>
                <Select 
                  value={selectedUnit} 
                  onValueChange={setSelectedUnit}
                  disabled={!!coordinatorUnit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    {!coordinatorUnit && <SelectItem value="all">Todas as unidades</SelectItem>}
                    <SelectItem value="madre">MADRE</SelectItem>
                    <SelectItem value="floresta">Floresta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Segunda linha: Tipo de Atendimento e Período */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Atendimento</Label>
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

              <div className="space-y-2">
                <Label className="text-sm font-medium">Mês</Label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Inicial</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Final</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
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
                    Paciente: {clients.find(c => c.id === selectedClient)?.name}
                  </Badge>
                )}
                {selectedUnit !== 'all' && (
                  <Badge variant="outline">
                    Unidade: {selectedUnit === 'madre' ? 'MADRE' : 
                             selectedUnit === 'floresta' ? 'Floresta' :
                             selectedUnit === 'atendimento_floresta' ? 'Atendimento Floresta' :
                             selectedUnit}
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
                      <TableHead>Paciente</TableHead>
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

        <TabsContent value="analytics">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Avançados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label>Funcionário</Label>
                    <Combobox
                      options={[
                        { value: "all", label: "Todos os funcionários" },
                        ...employees.map(employee => ({
                          value: employee.user_id,
                          label: employee.name
                        }))
                      ]}
                      value={selectedEmployee}
                      onValueChange={setSelectedEmployee}
                      placeholder="Buscar funcionário..."
                      searchPlaceholder="Digite o nome do funcionário..."
                      emptyMessage="Nenhum funcionário encontrado."
                    />
                  </div>

                  <div>
                    <Label>Paciente</Label>
                    <Combobox
                      options={[
                        { value: "all", label: "Todos os pacientes" },
                        ...clients.map(client => ({
                          value: client.id,
                          label: client.name
                        }))
                      ]}
                      value={selectedClient}
                      onValueChange={setSelectedClient}
                      placeholder="Buscar paciente..."
                      searchPlaceholder="Digite o nome do paciente..."
                      emptyMessage="Nenhum paciente encontrado."
                    />
                  </div>

                  <div>
                    <Label>Período</Label>
                    <Input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                          <p className="text-2xl font-bold text-green-600">
                            {attendanceReports.length > 0 
                              ? Math.round((attendanceReports.filter(r => r.validation_status === 'validated').length / attendanceReports.length) * 100)
                              : 0}%
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Receita Total</p>
                          <p className="text-2xl font-bold text-blue-600">
                            R$ {getTotalRevenue().toFixed(2)}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Pacientes Únicos</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {getUniqueClients()}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Tempo Médio</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {Math.round(getAverageDuration())} min
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Relatório Detalhado do Funcionário */}
                {selectedEmployee !== 'all' && (
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Relatório Detalhado - {employees.find(e => e.user_id === selectedEmployee)?.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Total de Atendimentos</p>
                                <p className="text-3xl font-bold text-blue-600">
                                  {attendanceReports.length}
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Horas Trabalhadas</p>
                                <p className="text-3xl font-bold text-green-600">
                                  {Math.round(attendanceReports.reduce((sum, r) => sum + (r.session_duration || 0), 0) / 60)}h
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Receita Gerada</p>
                                <p className="text-3xl font-bold text-green-600">
                                  R$ {getTotalRevenue().toFixed(2)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Tabela de Atendimentos */}
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Paciente</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Duração</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {attendanceReports.map((report) => (
                                <TableRow key={report.id}>
                                  <TableCell>
                                    {format(new Date(report.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                                  </TableCell>
                                  <TableCell>{report.patient_name || report.clients?.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{report.attendance_type}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {report.session_duration ? `${report.session_duration} min` : '-'}
                                  </TableCell>
                                  <TableCell>
                                    {report.amount_charged ? `R$ ${report.amount_charged.toFixed(2)}` : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={
                                        report.validation_status === 'validated' ? 'default' :
                                        report.validation_status === 'rejected' ? 'destructive' :
                                        'secondary'
                                      }
                                    >
                                      {report.validation_status === 'validated' ? 'Validado' :
                                       report.validation_status === 'rejected' ? 'Rejeitado' :
                                       'Pendente'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {attendanceReports.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum atendimento encontrado para os filtros selecionados</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Análise de Performance */}
                    {employeeReports.filter(r => r.employee_id === selectedEmployee).length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Análise de Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h4 className="font-semibold">Avaliações Médias</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span>Qualidade</span>
                                  <div className="flex items-center gap-2">
                                    {renderStars(getAverageRating(employeeReports.filter(r => r.employee_id === selectedEmployee), 'quality_rating'))}
                                    <span className="text-sm text-muted-foreground">
                                      ({getAverageRating(employeeReports.filter(r => r.employee_id === selectedEmployee), 'quality_rating').toFixed(1)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Esforço</span>
                                  <div className="flex items-center gap-2">
                                    {renderStars(getAverageRating(employeeReports.filter(r => r.employee_id === selectedEmployee), 'effort_rating'))}
                                    <span className="text-sm text-muted-foreground">
                                      ({getAverageRating(employeeReports.filter(r => r.employee_id === selectedEmployee), 'effort_rating').toFixed(1)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Cooperação do Paciente</span>
                                  <div className="flex items-center gap-2">
                                    {renderStars(getAverageRating(employeeReports.filter(r => r.employee_id === selectedEmployee), 'patient_cooperation'))}
                                    <span className="text-sm text-muted-foreground">
                                      ({getAverageRating(employeeReports.filter(r => r.employee_id === selectedEmployee), 'patient_cooperation').toFixed(1)})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Alcance de Objetivos</span>
                                  <div className="flex items-center gap-2">
                                    {renderStars(getAverageRating(employeeReports.filter(r => r.employee_id === selectedEmployee), 'goal_achievement'))}
                                    <span className="text-sm text-muted-foreground">
                                      ({getAverageRating(employeeReports.filter(r => r.employee_id === selectedEmployee), 'goal_achievement').toFixed(1)})
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-semibold">Estatísticas do Período</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span>Pacientes Atendidos</span>
                                  <span className="font-semibold">
                                    {new Set(attendanceReports.map(r => r.client_id)).size}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tempo Total</span>
                                  <span className="font-semibold">
                                    {Math.round(attendanceReports.reduce((sum, r) => sum + (r.session_duration || 0), 0) / 60)} horas
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Custo de Materiais</span>
                                  <span className="font-semibold">
                                    R$ {employeeReports
                                      .filter(r => r.employee_id === selectedEmployee)
                                      .reduce((sum, r) => sum + (r.materials_cost || 0), 0)
                                      .toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Sessões Validadas</span>
                                  <span className="font-semibold">
                                    {attendanceReports.filter(r => r.validation_status === 'validated').length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Visão Geral quando nenhum funcionário específico está selecionado */}
                {selectedEmployee === 'all' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo Geral dos Funcionários</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Funcionário</TableHead>
                            <TableHead>Atendimentos</TableHead>
                            <TableHead>Pacientes</TableHead>
                            <TableHead>Horas</TableHead>
                            <TableHead>Receita</TableHead>
                            <TableHead>Qualidade Média</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map((employee) => {
                            const employeeAttendances = attendanceReports.filter(r => r.employee_id === employee.user_id);
                            const employeeEmployeeReports = employeeReports.filter(r => r.employee_id === employee.user_id);
                            const totalHours = Math.round(employeeAttendances.reduce((sum, r) => sum + (r.session_duration || 0), 0) / 60);
                            const totalRevenue = employeeAttendances.reduce((sum, r) => sum + (r.amount_charged || 0), 0);
                            const uniquePatients = new Set(employeeAttendances.map(r => r.client_id)).size;
                            const avgQuality = getAverageRating(employeeEmployeeReports, 'quality_rating');

                            return (
                              <TableRow key={employee.user_id}>
                                <TableCell className="font-medium">{employee.name}</TableCell>
                                <TableCell>{employeeAttendances.length}</TableCell>
                                <TableCell>{uniquePatients}</TableCell>
                                <TableCell>{totalHours}h</TableCell>
                                <TableCell>R$ {totalRevenue.toFixed(2)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {renderStars(avgQuality)}
                                    <span className="text-sm text-muted-foreground">
                                      ({avgQuality.toFixed(1)})
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <DeleteFinancialRecordsDialog 
        open={isDeleteFinancialDialogOpen}
        onClose={() => setIsDeleteFinancialDialogOpen(false)}
      />
    </div>
  );
}