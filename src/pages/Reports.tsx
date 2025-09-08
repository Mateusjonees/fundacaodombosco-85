import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { FileText, Download, Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';

interface ReportData {
  clients: any[];
  schedules: any[];
  financial: any[];
  employees: any[];
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData>({
    clients: [],
    schedules: [],
    financial: [],
    employees: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const { toast } = useToast();

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Load all necessary data for reports
      const [clientsRes, schedulesRes, financialRes, employeesRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('schedules').select('*'),
        supabase.from('financial_records').select('*'),
        supabase.from('profiles').select('*')
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (schedulesRes.error) throw schedulesRes.error;
      if (financialRes.error) throw financialRes.error;
      if (employeesRes.error) throw employeesRes.error;

      setReportData({
        clients: clientsRes.data || [],
        schedules: schedulesRes.data || [],
        financial: financialRes.data || [],
        employees: employeesRes.data || []
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados dos relatórios.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalClients = reportData.clients.length;
  const activeClients = reportData.clients.filter(c => c.status === 'active').length;
  const totalSchedules = reportData.schedules.length;
  const completedSchedules = reportData.schedules.filter(s => s.status === 'completed').length;
  const totalRevenue = reportData.financial.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = reportData.financial.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);

  // Monthly appointments data for chart
  const monthlyAppointments = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const appointments = reportData.schedules.filter(s => {
      const date = new Date(s.appointment_date);
      return date.getMonth() + 1 === month && date.getFullYear() === new Date().getFullYear();
    });
    return {
      month: new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
      appointments: appointments.length,
      completed: appointments.filter(a => a.status === 'completed').length
    };
  });

  // Financial data for chart
  const monthlyFinancial = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const income = reportData.financial.filter(f => {
      const date = new Date(f.transaction_date);
      return f.type === 'income' && date.getMonth() + 1 === month && date.getFullYear() === new Date().getFullYear();
    }).reduce((sum, f) => sum + f.amount, 0);
    
    const expense = reportData.financial.filter(f => {
      const date = new Date(f.transaction_date);
      return f.type === 'expense' && date.getMonth() + 1 === month && date.getFullYear() === new Date().getFullYear();
    }).reduce((sum, f) => sum + f.amount, 0);

    return {
      month: new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
      income,
      expense,
      profit: income - expense
    };
  });

  // Appointment types distribution
  const appointmentTypes = reportData.schedules.reduce((acc: any, schedule) => {
    const type = schedule.type || 'consultation';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const appointmentTypesData = Object.entries(appointmentTypes).map(([name, value]) => ({
    name,
    value: value as number
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  const exportReport = () => {
    // Simple report generation - in a real app, you'd use a proper library
    const reportContent = {
      periodo: selectedPeriod,
      data: new Date().toISOString(),
      estatisticas: {
        totalClientes: totalClients,
        clientesAtivos: activeClients,
        totalConsultas: totalSchedules,
        consultasCompletas: completedSchedules,
        receitaTotal: totalRevenue,
        despesaTotal: totalExpenses,
        lucro: totalRevenue - totalExpenses
      }
    };

    const dataStr = JSON.stringify(reportContent, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `relatorio-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {activeClients} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchedules}</div>
            <p className="text-xs text-muted-foreground">
              {completedSchedules} realizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(totalRevenue - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {(totalRevenue - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Consultas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyAppointments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="hsl(var(--primary))" />
                <Bar dataKey="completed" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {appointmentTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyFinancial}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2} name="Receita" />
                <Line type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2} name="Despesa" />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--secondary))" strokeWidth={2} name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(new Set(reportData.employees.map(e => e.employee_role))).map(role => {
                const count = reportData.employees.filter(e => e.employee_role === role).length;
                return (
                  <div key={role} className="flex justify-between items-center">
                    <span className="text-sm">{role}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Clientes Ativos</span>
                <Badge variant="default">{activeClients}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Clientes Inativos</span>
                <Badge variant="secondary">{totalClients - activeClients}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Taxa de Atividade</span>
                <Badge variant="outline">
                  {totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}