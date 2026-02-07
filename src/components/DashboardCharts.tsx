import { memo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Fetch all chart data in parallel with optimized queries
const fetchChartData = async () => {
  const today = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(today, 5));
  const threeMonthsAgo = subMonths(today, 3);
  const currentMonthEnd = endOfMonth(today);

  // Single parallel fetch for all data
  const [financialResult, clientPaymentsResult, automaticResult, clientsResult, attendanceResult] = await Promise.all([
    supabase
      .from('financial_records')
      .select('amount, type, date')
      .gte('date', format(sixMonthsAgo, 'yyyy-MM-dd'))
      .lte('date', format(currentMonthEnd, 'yyyy-MM-dd')),
    supabase
      .from('client_payments')
      .select('amount_paid, created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .lte('created_at', currentMonthEnd.toISOString()),
    supabase
      .from('automatic_financial_records')
      .select('amount, transaction_type, payment_date')
      .gte('payment_date', sixMonthsAgo.toISOString())
      .lte('payment_date', currentMonthEnd.toISOString()),
    supabase
      .from('clients')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .lte('created_at', currentMonthEnd.toISOString()),
    supabase
      .from('attendance_reports')
      .select('attendance_type')
      .gte('created_at', threeMonthsAgo.toISOString())
      .eq('validation_status', 'validated'),
  ]);

  // Process monthly data client-side
  const monthlyRevenue = [];
  const newPatients = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(today, i);
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(monthDate);
    const monthLabel = format(monthDate, 'MMM', { locale: ptBR });
    const label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    const mStartStr = format(mStart, 'yyyy-MM-dd');
    const mEndStr = format(mEnd, 'yyyy-MM-dd');

    const income = 
      (financialResult.data?.filter(r => r.type === 'income' && r.date >= mStartStr && r.date <= mEndStr).reduce((s, r) => s + Number(r.amount), 0) || 0) +
      (clientPaymentsResult.data?.filter(p => p.created_at >= mStart.toISOString() && p.created_at <= mEnd.toISOString()).reduce((s, p) => s + Number(p.amount_paid), 0) || 0) +
      (automaticResult.data?.filter(r => r.transaction_type === 'income' && r.payment_date >= mStart.toISOString() && r.payment_date <= mEnd.toISOString()).reduce((s, r) => s + Number(r.amount), 0) || 0);

    const expense = 
      (financialResult.data?.filter(r => r.type === 'expense' && r.date >= mStartStr && r.date <= mEndStr).reduce((s, r) => s + Number(r.amount), 0) || 0) +
      (automaticResult.data?.filter(r => r.transaction_type === 'expense' && r.payment_date >= mStart.toISOString() && r.payment_date <= mEnd.toISOString()).reduce((s, r) => s + Number(r.amount), 0) || 0);

    monthlyRevenue.push({ month: label, receita: income, despesa: expense });
    
    const novos = clientsResult.data?.filter(c => c.created_at >= mStart.toISOString() && c.created_at <= mEnd.toISOString()).length || 0;
    newPatients.push({ month: label, novos });
  }

  // Attendance types
  const typeCounts: Record<string, number> = {};
  (attendanceResult.data || []).forEach(a => {
    const type = a.attendance_type || 'Outros';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  const attendanceTypes = Object.entries(typeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return { monthlyRevenue, attendanceTypes, newPatients };
};

const ChartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

export const DashboardCharts = memo(() => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: fetchChartData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Skeleton className="h-[260px] sm:h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[260px] sm:h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[260px] sm:h-[300px] w-full hidden xl:block rounded-xl" />
      </div>
    );
  }

  const { monthlyRevenue, attendanceTypes, newPatients } = data;
  const chartHeight = 200;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {/* Receitas x Despesas */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-1 pt-3 px-3 sm:px-4 bg-gradient-to-r from-emerald-500/10 to-transparent">
          <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />
            Receitas x Despesas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 px-1 sm:px-3">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={monthlyRevenue} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={ChartTooltipStyle} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="receita" fill="hsl(var(--chart-2))" name="Receita" radius={[3, 3, 0, 0]} />
              <Bar dataKey="despesa" fill="hsl(var(--chart-1))" name="Despesa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tipos de Atendimento */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-1 pt-3 px-3 sm:px-4 bg-gradient-to-r from-blue-500/10 to-transparent">
          <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
            <PieChartIcon className="h-3.5 w-3.5 text-blue-500" />
            Tipos de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 px-1 sm:px-3">
          {attendanceTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
                <Pie data={attendanceTypes} cx="50%" cy="45%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {attendanceTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={ChartTooltipStyle} formatter={(value: number, name: string) => [value, name]} />
                <Legend wrapperStyle={{ fontSize: '9px' }} formatter={(v) => v.length > 12 ? `${v.substring(0, 12)}…` : v} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
          )}
        </CardContent>
      </Card>

      {/* Novos Pacientes */}
      <Card className="border-0 shadow-lg overflow-hidden sm:col-span-2 xl:col-span-1">
        <CardHeader className="pb-1 pt-3 px-3 sm:px-4 bg-gradient-to-r from-purple-500/10 to-transparent">
          <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
            Novos Pacientes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 px-1 sm:px-3">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={newPatients} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <Tooltip contentStyle={ChartTooltipStyle} />
              <Line type="monotone" dataKey="novos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 5 }} name="Novos" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});

DashboardCharts.displayName = 'DashboardCharts';
