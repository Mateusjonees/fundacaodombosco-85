import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { TimeClock } from '@/components/TimeClock';
import { BirthdayAlerts } from '@/components/BirthdayAlerts';
import { DashboardCharts } from '@/components/DashboardCharts';
import { DashboardUpcomingAppointments } from '@/components/DashboardUpcomingAppointments';
import { DashboardActionCards } from '@/components/DashboardActionCards';
import { NeuroDeadlineAlerts } from '@/components/NeuroDeadlineAlerts';
import { useNeuroStats } from '@/hooks/useNeuroStats';
import { Users, Calendar, DollarSign, UserPlus, Activity, CheckCircle2, Brain, AlertTriangle, Clock, FileText } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROLE_LABELS } from '@/hooks/useRolePermissions';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatCard = ({ 
  title, value, subtitle, icon: Icon, color, onClick, delay = 0 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: any; 
  color: string;
  onClick?: () => void;
  delay?: number;
}) => (
  <Card 
    className={`group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-200 hover:shadow-md opacity-0 animate-stagger-in ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    onClick={onClick}
  >
    <CardContent className="p-3 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </p>
          <p className={`text-xl sm:text-3xl font-extrabold tracking-tight ${color}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${color.replace('text-', 'bg-').split(' ')[0]}/10 group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${color.split(' ')[0]}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { profile, userName, userRole, loading: profileLoading } = useCurrentUser();
  const { data: stats, isLoading: statsLoading } = useDashboardStats(profile);
  const navigate = useNavigate();

  // Profissionais são redirecionados para "Meus Pacientes" como página principal
  const isAdminRole = ['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist', 'financeiro'].includes(userRole || '');
  
  useEffect(() => {
    if (!profileLoading && userRole && !isAdminRole) {
      navigate('/my-patients', { replace: true });
    }
  }, [profileLoading, userRole, isAdminRole, navigate]);

  const isLoading = profileLoading || statsLoading;
  const isDirectorOrCoordinator = ['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta'].includes(userRole || '');
  const isNeuroCoordinator = ['coordinator_floresta', 'coordinator_atendimento_floresta'].includes(userRole || '');
  const { data: neuroStats } = useNeuroStats(isNeuroCoordinator);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Bom dia' : today.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const dateStr = format(today, "EEEE, dd 'de' MMMM", { locale: ptBR });

  if (isLoading || !stats) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        <Skeleton className="h-20 sm:h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 sm:h-28 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const completionPercent = stats.todayAppointments > 0 
    ? Math.round((stats.completedToday / stats.todayAppointments) * 100) 
    : 0;

  const revenueChangeLabel = stats.revenueChange !== null && stats.revenueChange !== undefined
    ? (stats.revenueChange >= 0 ? `+${stats.revenueChange}%` : `${stats.revenueChange}%`)
    : null;

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Welcome card */}
      <div className="relative overflow-hidden rounded-lg sm:rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-glow p-3 sm:p-8 text-primary-foreground animate-scale-in">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZyIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMCA0MEw0MCAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative flex items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <p className="text-primary-foreground/70 text-[10px] sm:text-sm font-medium">
              {greeting},
            </p>
            <h1 className="text-base sm:text-3xl font-bold tracking-tight uppercase truncate">{userName}</h1>
            <div className="flex items-center gap-2 mt-0.5 sm:mt-2">
              <Badge className="bg-white/15 hover:bg-white/20 border-0 text-primary-foreground text-[9px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5">
                {userRole ? ROLE_LABELS[userRole] : 'Usuário'}
              </Badge>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-primary-foreground/60 text-xs capitalize">{dateStr}</p>
            <div className="flex items-center gap-1.5 mt-1 text-primary-foreground/50">
              <Activity className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats - staggered animation */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <StatCard
          title={isDirectorOrCoordinator ? 'Total Pacientes' : 'Meus Pacientes'}
          value={stats.totalClients}
          icon={Users}
          color="text-blue-600 dark:text-blue-400"
          onClick={() => navigate('/clients')}
          delay={50}
        />
        <StatCard
          title="Consultas Hoje"
          value={stats.todayAppointments}
          subtitle={stats.completedToday > 0 ? `${stats.completedToday} concluída(s)` : undefined}
          icon={Calendar}
          color="text-emerald-600 dark:text-emerald-400"
          onClick={() => navigate('/schedule')}
          delay={100}
        />
        {isDirectorOrCoordinator && (
          <>
            <StatCard
              title="Receita Mensal"
              value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
              subtitle={revenueChangeLabel ? `${revenueChangeLabel} vs mês anterior` : undefined}
              icon={DollarSign}
              color="text-amber-600 dark:text-amber-400"
              onClick={() => navigate('/financial')}
              delay={150}
            />
            <StatCard
              title="Funcionários"
              value={stats.totalEmployees}
              icon={UserPlus}
              color="text-violet-600 dark:text-violet-400"
              onClick={() => navigate('/employees-new')}
              delay={200}
            />
          </>
        )}
      </div>

      {/* Progresso do dia */}
      {stats.todayAppointments > 0 && (
        <Card className="border border-border/50 animate-slide-up" style={{ animationDelay: '120ms', animationFillMode: 'forwards' }}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Progresso do Dia</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-primary">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-2" />
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5">
              {stats.completedToday} de {stats.todayAppointments} atendimentos concluídos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Seção Neuro para coordenadores neuro */}
      {isNeuroCoordinator && neuroStats && (
        <div className="space-y-3">
          <NeuroDeadlineAlerts />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <StatCard
              title="Laudos Pendentes"
              value={neuroStats.pendingReports}
              subtitle={neuroStats.overdueReports > 0 ? `${neuroStats.overdueReports} vencido(s)` : undefined}
              icon={FileText}
              color="text-amber-600 dark:text-amber-400"
              onClick={() => navigate('/neuroassessment')}
              delay={50}
            />
            <StatCard
              title="Próximos Vencimentos"
              value={neuroStats.upcomingDeadlines}
              subtitle="Nos próximos 7 dias"
              icon={AlertTriangle}
              color="text-rose-600 dark:text-rose-400"
              onClick={() => navigate('/neuroassessment')}
              delay={100}
            />
            <StatCard
              title="Laudos Entregues"
              value={neuroStats.deliveredReports}
              icon={CheckCircle2}
              color="text-emerald-600 dark:text-emerald-400"
              onClick={() => navigate('/neuroassessment')}
              delay={150}
            />
            <StatCard
              title="Horas Neuro"
              value={`${neuroStats.totalHours}h`}
              subtitle={`${neuroStats.totalPatients} pacientes`}
              icon={Brain}
              color="text-violet-600 dark:text-violet-400"
              onClick={() => navigate('/neuroassessment')}
              delay={200}
            />
          </div>
        </div>
      )}

      {/* Action cards */}
      {isDirectorOrCoordinator && <DashboardActionCards />}

      {/* Grid: Próximos + Ponto + Aniversários */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardUpcomingAppointments 
          userId={profile?.user_id} 
          isAdmin={isDirectorOrCoordinator} 
        />
        <TimeClock />
        <BirthdayAlerts />
      </div>

      {/* Charts */}
      {isDirectorOrCoordinator && <DashboardCharts />}
    </div>
  );
}
