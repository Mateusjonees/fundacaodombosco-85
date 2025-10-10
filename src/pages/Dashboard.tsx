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
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        Painel
      </h2>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Bem-vindo ao Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3 leading-relaxed">
                Olá, <strong className="text-foreground">{currentUserProfile?.name || user?.email}</strong>! 
                Você está conectado ao sistema da Fundação Dom Bosco como <Badge variant="secondary" className="ml-1">{currentUserProfile?.employee_role ? ROLE_LABELS[currentUserProfile.employee_role] : 'Usuário'}</Badge>.
              </p>
              <p className="text-sm text-muted-foreground">
                Use o menu lateral para acessar as diferentes funcionalidades do sistema.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isDirectorOrCoordinator ? 'Total de Pacientes' : 'Meus Pacientes'}
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isDirectorOrCoordinator ? 'Cadastrados no sistema' : 'Vinculados a você'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isDirectorOrCoordinator ? 'Consultas Hoje' : 'Minhas Consultas Hoje'}
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Agendamentos para hoje
            </p>
          </CardContent>
        </Card>

        {isDirectorOrCoordinator && (
          <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Mensal
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Faturamento do mês
              </p>
            </CardContent>
          </Card>
        )}

        {isDirectorOrCoordinator && (
          <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Funcionários
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">
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