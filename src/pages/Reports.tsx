import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { FileText, Users, Calendar, Star, TrendingUp, Download } from 'lucide-react';
import { format } from 'date-fns';
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
  const [employeeReports, setEmployeeReports] = useState<EmployeeReport[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
    loadEmployeeReports();
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('employee_role', 'is', null)
        .order('name');

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
          clients(name),
          profiles(name)
        `)
        .order('session_date', { ascending: false })
        .limit(100);

      if (selectedEmployee !== 'all') {
        query = query.eq('employee_id', selectedEmployee);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmployeeReports(data || []);
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

  const getAverageRating = (reports: EmployeeReport[], field: keyof EmployeeReport) => {
    const validRatings = reports
      .map(r => r[field] as number)
      .filter(rating => rating && rating > 0);
    
    if (validRatings.length === 0) return 0;
    return validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
  };

  const getTotalSessions = () => employeeReports.length;
  const getTotalMaterialsCost = () => employeeReports.reduce((sum, report) => sum + (report.materials_cost || 0), 0);
  const getAverageDuration = () => {
    const durationsWithValues = employeeReports.filter(r => r.session_duration && r.session_duration > 0);
    if (durationsWithValues.length === 0) return 0;
    return durationsWithValues.reduce((sum, r) => sum + (r.session_duration || 0), 0) / durationsWithValues.length;
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

  if (loading) {
    return <div className="p-6">Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <div className="flex gap-2">
          <select 
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">Todos os funcionários</option>
            {employees.map(employee => (
              <option key={employee.user_id} value={employee.user_id}>
                {employee.name}
              </option>
            ))}
          </select>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalSessions()}</div>
            <p className="text-xs text-muted-foreground">Sessões realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getAverageRating(employeeReports, 'quality_rating').toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Qualidade das sessões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(getAverageDuration())} min
            </div>
            <p className="text-xs text-muted-foreground">Por sessão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Materiais</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {getTotalMaterialsCost().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total gasto</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sessions">Relatórios de Sessões</TabsTrigger>
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="materials">Uso de Materiais</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Sessões</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Qualidade</TableHead>
                    <TableHead>Objetivos</TableHead>
                    <TableHead>Materiais</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {format(new Date(report.session_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{report.profiles?.name}</TableCell>
                      <TableCell>{report.clients?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.session_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {report.session_duration ? `${report.session_duration} min` : '-'}
                      </TableCell>
                      <TableCell>
                        {renderStars(report.quality_rating)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={report.session_objectives || ''}>
                          {report.session_objectives || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        R$ {(report.materials_cost || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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