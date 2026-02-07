import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Activity, Users, Clock, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const ClinicalKPIs = () => {
  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  const { data: schedules = [] } = useQuery({
    queryKey: ['kpi-schedules', monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('id, status, employee_id, service_type, appointment_date')
        .gte('appointment_date', monthStart)
        .lte('appointment_date', monthEnd);
      if (error) throw error;
      return data;
    },
  });

  const { data: waitList = [] } = useQuery({
    queryKey: ['kpi-waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wait_list').select('id, created_at, status').eq('status', 'waiting');
      if (error) throw error;
      return data;
    },
  });

  const { data: absences = [] } = useQuery({
    queryKey: ['kpi-absences', monthStart],
    queryFn: async () => {
      const { data, error } = await supabase.from('absence_records').select('id').gte('absence_date', monthStart);
      if (error) throw error;
      return data;
    },
  });

  const { data: financials = [] } = useQuery({
    queryKey: ['kpi-financials', monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_records')
        .select('amount, type, category')
        .gte('date', monthStart)
        .lte('date', monthEnd);
      if (error) throw error;
      return data;
    },
  });

  // Calculations
  const totalSchedules = schedules.length;
  const completed = schedules.filter((s: any) => s.status === 'completed').length;
  const cancelled = schedules.filter((s: any) => s.status === 'cancelled').length;
  const occupancyRate = totalSchedules > 0 ? Math.round((completed / totalSchedules) * 100) : 0;
  const cancelRate = totalSchedules > 0 ? Math.round((cancelled / totalSchedules) * 100) : 0;
  const absenceRate = totalSchedules > 0 ? Math.round((absences.length / totalSchedules) * 100) : 0;

  const totalIncome = financials.filter((f: any) => f.type === 'income').reduce((s: number, f: any) => s + Number(f.amount), 0);
  const totalExpense = financials.filter((f: any) => f.type === 'expense').reduce((s: number, f: any) => s + Number(f.amount), 0);

  // By service type
  const byServiceType = schedules.reduce((acc: any, s: any) => {
    const type = s.service_type || 'Outros';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const serviceTypeData = Object.entries(byServiceType).map(([name, value]) => ({ name, value }));

  // By status
  const statusData = [
    { name: 'Concluídos', value: completed },
    { name: 'Cancelados', value: cancelled },
    { name: 'Faltas', value: absences.length },
    { name: 'Agendados', value: totalSchedules - completed - cancelled },
  ].filter(d => d.value > 0);

  // Average wait time
  const avgWaitDays = waitList.length > 0
    ? Math.round(waitList.reduce((sum: number, w: any) => {
        const days = Math.floor((Date.now() - new Date(w.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / waitList.length)
    : 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indicadores Clínicos (KPIs)</h1>
          <p className="text-sm text-muted-foreground">Métricas do mês atual</p>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Taxa Ocupação', value: `${occupancyRate}%`, icon: Activity, color: 'text-primary' },
            { label: 'Taxa Cancelamento', value: `${cancelRate}%`, icon: Calendar, color: 'text-destructive' },
            { label: 'Taxa Faltas', value: `${absenceRate}%`, icon: Users, color: 'text-amber-600' },
            { label: 'Na Fila', value: waitList.length, icon: Clock, color: 'text-blue-600' },
            { label: 'Tempo Médio Fila', value: `${avgWaitDays}d`, icon: TrendingUp, color: 'text-purple-600' },
            { label: 'Receita Líquida', value: `R$ ${((totalIncome - totalExpense) / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-green-600' },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <kpi.icon className={`h-6 w-6 mx-auto mb-2 ${kpi.color}`} />
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Distribuição por Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* By Service Type */}
          <Card>
            <CardHeader><CardTitle className="text-base">Atendimentos por Tipo</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={serviceTypeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default ClinicalKPIs;
