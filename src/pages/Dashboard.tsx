import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeClock } from '@/components/TimeClock';
import { Users, Calendar, DollarSign, UserPlus } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROLE_LABELS } from '@/hooks/useRolePermissions';

export default function Dashboard() {
  // Usar hook centralizado com cache
  const { profile, userName, userRole, loading: profileLoading } = useCurrentUser();
  
  // Usar React Query para cache automático e otimização com batch queries
  const { data: stats, isLoading: statsLoading } = useDashboardStats(profile);

  const isLoading = profileLoading || statsLoading;

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  const isDirectorOrCoordinator = ['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta'].includes(userRole || '');

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in p-2 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-8 sm:h-10 w-1 sm:w-1.5 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Painel
        </h2>
      </div>
      
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Welcome Card */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-primary/5 via-card to-primary/10">
            <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <CardHeader className="pb-3 sm:pb-4 relative">
              <CardTitle className="text-lg sm:text-2xl flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-primary to-primary/70 rounded-lg sm:rounded-xl shadow-lg">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Bem-vindo ao Sistema
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-2 sm:space-y-3">
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Olá, <span className="font-bold text-foreground text-base sm:text-lg">{userName}</span>!
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm text-muted-foreground">Conectado como:</span>
                <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                  {userRole ? ROLE_LABELS[userRole] : 'Usuário'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border/50">
                💡 Use o menu lateral para acessar todas as funcionalidades.
              </p>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-blue-500/10 via-card to-blue-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {isDirectorOrCoordinator ? 'Total de Pacientes' : 'Meus Pacientes'}
                </CardTitle>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-extrabold bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stats.totalClients}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {isDirectorOrCoordinator ? 'Cadastrados no sistema' : 'Vinculados a você'}
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-green-500/10 via-card to-green-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {isDirectorOrCoordinator ? 'Consultas Hoje' : 'Minhas Consultas Hoje'}
                </CardTitle>
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-extrabold bg-gradient-to-br from-green-600 to-green-400 bg-clip-text text-transparent mb-2">
                  {stats.todayAppointments}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Agendamentos para hoje
                </p>
              </CardContent>
            </Card>

            {isDirectorOrCoordinator && (
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">
                    Receita Mensal
                  </CardTitle>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-extrabold bg-gradient-to-br from-emerald-600 to-emerald-400 bg-clip-text text-transparent mb-2">
                    R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Faturamento do mês
                  </p>
                </CardContent>
              </Card>
            )}

            {isDirectorOrCoordinator && (
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-purple-500/10 via-card to-purple-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">
                    Funcionários
                  </CardTitle>
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-extrabold bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stats.totalEmployees}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Registrados no sistema
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Ponto Eletrônico */}
        <div className="lg:col-span-1">
          <TimeClock />
        </div>
      </div>
    </div>
  );
}
