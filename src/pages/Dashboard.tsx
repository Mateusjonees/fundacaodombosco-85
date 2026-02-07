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
  <Card className="group relative overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className={`text-3xl font-extrabold tracking-tight ${color}`}>
            {value}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color.replace('text-', 'bg-').split(' ')[0]}/10 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-6 w-6 ${color.split(' ')[0]}`} />
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
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-glow p-6 sm:p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZTM5LjMxNCAxMiAzNiAxMnMtNiAyLjY4Ni02IDYgMi42ODYgNiA2IDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-primary-foreground/70 text-sm font-medium">
              Bom {new Date().getHours() < 12 ? 'dia' : new Date().getHours() < 18 ? 'tarde' : 'noite'},
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">{userName}</h1>
            <Badge className="mt-2 bg-white/15 hover:bg-white/20 border-0 text-primary-foreground text-xs">
              {userRole ? ROLE_LABELS[userRole] : 'Usuário'}
            </Badge>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-primary-foreground/50">
            <Activity className="h-5 w-5" />
            <span className="text-sm font-medium">Sistema Online</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <TimeClock />
          <BirthdayAlerts />
        </div>
      </div>

      {/* Charts */}
      {isDirectorOrCoordinator && (
        <DashboardCharts />
      )}
    </div>
  );
}
