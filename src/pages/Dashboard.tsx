import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
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
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Painel</h2>
        <p className="text-sm text-muted-foreground">Visão geral do sistema</p>
      </div>
      
      <Card className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Olá, {currentUserProfile?.name || user?.email?.split('@')[0]}! 👋</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Você está conectado como <strong className="text-foreground">{currentUserProfile?.employee_role ? ROLE_LABELS[currentUserProfile.employee_role] : 'Usuário'}</strong>
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isDirectorOrCoordinator ? 'Total Pacientes' : 'Meus Pacientes'}
            </CardTitle>
            <div className="p-2.5 sm:p-3 bg-green-500 rounded-xl shadow-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {isDirectorOrCoordinator ? 'no sistema' : 'atribuídos'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isDirectorOrCoordinator ? 'Consultas Hoje' : 'Minhas Consultas'}
            </CardTitle>
            <div className="p-2.5 sm:p-3 bg-emerald-500 rounded-xl shadow-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              hoje
            </p>
          </CardContent>
        </Card>

        {isDirectorOrCoordinator && (
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-teal-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Receita Mensal
              </CardTitle>
              <div className="p-2.5 sm:p-3 bg-teal-500 rounded-xl shadow-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground">
                este mês
              </p>
            </CardContent>
          </Card>
        )}

        {isDirectorOrCoordinator && (
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-lime-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Funcionários
              </CardTitle>
              <div className="p-2.5 sm:p-3 bg-lime-500 rounded-xl shadow-lg">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                ativos
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}