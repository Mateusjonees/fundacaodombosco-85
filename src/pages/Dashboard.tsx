import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { TimeClock } from '@/components/TimeClock';
import { Users, Calendar, DollarSign, UserPlus } from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  todayAppointments: number;
  monthlyRevenue: number;
  totalEmployees: number;
}

const ROLE_LABELS: Record<string, string> = {
  director: 'Diretor(a)',
  coordinator_madre: 'Coordenador(a) Madre',
  coordinator_floresta: 'Coordenador(a) Floresta',
  staff: 'Funcionário(a) Geral',
  intern: 'Estagiário(a)',
  musictherapist: 'Musicoterapeuta',
  financeiro: 'Financeiro',
  receptionist: 'Recepcionista',
  psychologist: 'Psicólogo(a)',
  psychopedagogue: 'Psicopedagogo(a)',
  speech_therapist: 'Fonoaudiólogo(a)',
  nutritionist: 'Nutricionista',
  physiotherapist: 'Fisioterapeuta'
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    totalEmployees: 0
  });
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
      } else {
        setCurrentUserProfile(profile);
      }

      // Load stats based on user role
      const isDirector = profile?.employee_role === 'director';
      const isCoordinator = ['coordinator_madre', 'coordinator_floresta'].includes(profile?.employee_role);

      // Load clients count
      let clientsQuery = supabase.from('clients').select('id', { count: 'exact' });
      
      if (!isDirector && !isCoordinator) {
        // Staff only sees assigned clients
        const { data: assignments } = await supabase
          .from('client_assignments')
          .select('client_id')
          .eq('employee_id', user?.id)
          .eq('is_active', true);

        const clientIds = assignments?.map(a => a.client_id) || [];
        if (clientIds.length > 0) {
          clientsQuery = clientsQuery.in('id', clientIds);
        } else {
          clientsQuery = clientsQuery.eq('id', 'no-match'); // Force empty result
        }
      }

      const { count: clientsCount } = await clientsQuery;
      
      // Load today's appointments
      const today = new Date().toISOString().split('T')[0];
      let schedulesQuery = supabase
        .from('schedules')
        .select('id', { count: 'exact' })
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`);

      if (!isDirector && !isCoordinator) {
        schedulesQuery = schedulesQuery.eq('employee_id', user?.id);
      }

      const { count: appointmentsCount } = await schedulesQuery;

      // Load monthly revenue (only for directors/coordinators)
      let monthlyRevenue = 0;
      if (isDirector || isCoordinator) {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const { data: revenueData } = await supabase
          .from('financial_records')
          .select('amount')
          .eq('type', 'income')
          .gte('date', `${currentMonth}-01`)
          .lte('date', `${currentMonth}-31`);

        monthlyRevenue = revenueData?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;
      }

      // Load employees count (only for directors/coordinators)
      let employeesCount = 0;
      if (isDirector || isCoordinator) {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .not('employee_role', 'is', null);
        employeesCount = count || 0;
      }

      setStats({
        totalClients: clientsCount || 0,
        todayAppointments: appointmentsCount || 0,
        monthlyRevenue,
        totalEmployees: employeesCount
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
      <h2 className="text-3xl font-bold">Painel</h2>
        <div className="text-center py-8">Carregando...</div>
      </div>
    );
  }

  const isDirectorOrCoordinator = ['director', 'coordinator_madre', 'coordinator_floresta'].includes(currentUserProfile?.employee_role);

  return (
    <div className="space-y-8 animate-fade-in p-2">
      <div className="flex items-center gap-3">
        <div className="h-10 w-1.5 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Painel
        </h2>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Card */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-primary/5 via-card to-primary/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <CardHeader className="pb-4 relative">
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Bem-vindo ao Sistema
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <p className="text-base text-muted-foreground leading-relaxed">
                Olá, <span className="font-bold text-foreground text-lg">{currentUserProfile?.name || user?.email}</span>!
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Conectado como:</span>
                <Badge variant="secondary" className="text-sm px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                  {currentUserProfile?.employee_role ? ROLE_LABELS[currentUserProfile.employee_role] : 'Usuário'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground pt-2 border-t border-border/50">
                💡 Use o menu lateral para acessar todas as funcionalidades do sistema.
              </p>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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