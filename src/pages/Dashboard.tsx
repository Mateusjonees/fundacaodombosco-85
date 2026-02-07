import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeClock } from '@/components/TimeClock';
import { BirthdayAlerts } from '@/components/BirthdayAlerts';
import { DashboardCharts } from '@/components/DashboardCharts';
import { Users, Calendar, DollarSign, UserPlus, TrendingUp, Activity } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROLE_LABELS } from '@/hooks/useRolePermissions';

const StatCard = ({ 
  title, value, icon: Icon, color 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: string;
}) => (
  <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-200 hover:shadow-md">
    <CardContent className="p-3 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </p>
          <p className={`text-xl sm:text-3xl font-extrabold tracking-tight ${color}`}>
            {value}
          </p>
        </div>
        <div className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${color.replace('text-', 'bg-').split(' ')[0]}/10`}>
          <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${color.split(' ')[0]}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { profile, userName, userRole, loading: profileLoading } = useCurrentUser();
  const { data: stats, isLoading: statsLoading } = useDashboardStats(profile);

  const isLoading = profileLoading || statsLoading;
  const isDirectorOrCoordinator = ['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta'].includes(userRole || '');

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Welcome - compacto no mobile */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-glow p-4 sm:p-8 text-primary-foreground">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-primary-foreground/70 text-xs sm:text-sm font-medium">
              Bom {new Date().getHours() < 12 ? 'dia' : new Date().getHours() < 18 ? 'tarde' : 'noite'},
            </p>
            <h1 className="text-lg sm:text-3xl font-bold tracking-tight uppercase">{userName}</h1>
            <Badge className="mt-1 sm:mt-2 bg-white/15 hover:bg-white/20 border-0 text-primary-foreground text-[10px] sm:text-xs">
              {userRole ? ROLE_LABELS[userRole] : 'Usuário'}
            </Badge>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-primary-foreground/50">
            <Activity className="h-5 w-5" />
            <span className="text-sm font-medium">Sistema Online</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <StatCard
              title={isDirectorOrCoordinator ? 'Total Pacientes' : 'Meus Pacientes'}
              value={stats.totalClients}
              icon={Users}
              color="text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Consultas Hoje"
              value={stats.todayAppointments}
              icon={Calendar}
              color="text-emerald-600 dark:text-emerald-400"
            />
            {isDirectorOrCoordinator && (
              <>
                <StatCard
                  title="Receita Mensal"
                  value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  icon={DollarSign}
                  color="text-amber-600 dark:text-amber-400"
                />
                <StatCard
                  title="Funcionários"
                  value={stats.totalEmployees}
                  icon={UserPlus}
                  color="text-violet-600 dark:text-violet-400"
                />
              </>
            )}
          </div>

          {/* Charts inline to avoid gap */}
          {isDirectorOrCoordinator && (
            <DashboardCharts />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <TimeClock />
          <BirthdayAlerts />
        </div>
      </div>
    </div>
  );
}
