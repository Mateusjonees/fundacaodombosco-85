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
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Painel</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Olá, <strong>{currentUserProfile?.name || user?.email}</strong>! 
            Você está conectado ao sistema da Fundação Dom Bosco como <strong>{currentUserProfile?.employee_role ? ROLE_LABELS[currentUserProfile.employee_role] : 'Usuário'}</strong>.
          </p>
          <p className="text-muted-foreground">
            Use o menu lateral para acessar as diferentes funcionalidades do sistema.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isDirectorOrCoordinator ? 'Total de Clientes' : 'Meus Clientes'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {isDirectorOrCoordinator ? 'Cadastrados no sistema' : 'Vinculados a você'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isDirectorOrCoordinator ? 'Consultas Hoje' : 'Minhas Consultas Hoje'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Agendamentos para hoje
            </p>
          </CardContent>
        </Card>

        {isDirectorOrCoordinator && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Mensal
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Faturamento do mês
              </p>
            </CardContent>
          </Card>
        )}

        {isDirectorOrCoordinator && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Funcionários
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Registrados no sistema
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}