import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar, DollarSign, UserPlus, Package, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  todayAppointments: number;
  totalAppointments: number;
  monthlyRevenue: number;
  totalEmployees: number;
  lowStockItems: number;
  pendingAppointments: number;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  employee_role: string;
}

const ROLE_LABELS: Record<string, string> = {
  director: 'Diretor(a)',
  coordinator_madre: 'Coordenador(a) Madre',
  coordinator_floresta: 'Coordenador(a) Floresta',
  staff: 'Funcionário(a) Geral',
  intern: 'Estagiário(a)',
  musictherapist: 'Musicoterapeuta',
  receptionist: 'Recepcionista',
  psychologist: 'Psicólogo(a)',
  psychopedagogue: 'Psicopedagogo(a)',
  speech_therapist: 'Fonoaudiólogo(a)',
  nutritionist: 'Nutricionista',
  physiotherapist: 'Fisioterapeuta'
};

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    todayAppointments: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
    totalEmployees: 0,
    lowStockItems: 0,
    pendingAppointments: 0
  });
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadDashboardStats();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setCurrentUserProfile(data);
    } catch (error) {
      console.error('Unexpected error loading profile:', error);
    }
  };

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // Load basic stats
      const [
        clientsRes,
        employeesRes
      ] = await Promise.all([
        supabase.from('clients').select('id, is_active'),
        supabase.from('profiles').select('id')
      ]);

      const clients = clientsRes.data || [];
      const employees = employeesRes.data || [];

      const newStats: DashboardStats = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.is_active === true).length,
        todayAppointments: 0, // Will be implemented when schedules table is fixed
        totalAppointments: 0,
        monthlyRevenue: 0, // Will be implemented when financial_records table is fixed
        totalEmployees: employees.length,
        lowStockItems: 0, // Will be implemented when stock_items table is fixed
        pendingAppointments: 0
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as estatísticas do dashboard.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo, <strong>{currentUserProfile?.name || user?.email}</strong>! 
          Você está conectado como <strong>{currentUserProfile?.employee_role ? ROLE_LABELS[currentUserProfile.employee_role] : 'Usuário'}</strong>.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClients} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingAppointments} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Mês atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Cadastrar novo cliente</span>
              <Badge variant="outline" className="cursor-pointer">
                <Users className="h-3 w-3 mr-1" />
                Ir para Clientes
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Agendar consulta</span>
              <Badge variant="outline" className="cursor-pointer">
                <Calendar className="h-3 w-3 mr-1" />
                Ir para Agenda
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Registrar transação</span>
              <Badge variant="outline" className="cursor-pointer">
                <DollarSign className="h-3 w-3 mr-1" />
                Ir para Financeiro
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Verificar estoque</span>
              <Badge variant="outline" className="cursor-pointer">
                <Package className="h-3 w-3 mr-1" />
                Ir para Estoque
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <strong>Sistema:</strong> Fundação Dom Bosco
            </div>
            <div className="text-sm">
              <strong>Usuário:</strong> {currentUserProfile?.name || user?.email}
            </div>
            <div className="text-sm">
              <strong>Perfil:</strong> {currentUserProfile?.employee_role ? ROLE_LABELS[currentUserProfile.employee_role] : 'Carregando...'}
            </div>
            <div className="text-sm">
              <strong>Último acesso:</strong> {new Date().toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}