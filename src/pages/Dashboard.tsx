import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickActions } from '@/components/QuickActions';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar, DollarSign, UserPlus, Package, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScheduleAlerts } from '@/components/ScheduleAlerts';
import { ClientAssignmentManager } from '@/components/ClientAssignmentManager';
import { usePermissions } from '@/hooks/usePermissions';

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
  const navigate = useNavigate();
  const { isAdmin, isDirector } = usePermissions();
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
      // Get user profile first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('employee_role')
        .eq('user_id', user?.id)
        .single();

      // Load basic stats
      const [
        clientsRes,
        employeesRes,
        schedulesRes,
        financialRes,
        stockRes
      ] = await Promise.all([
        supabase.from('clients').select('id, is_active'),
        supabase.from('profiles').select('id'),
        loadTodaySchedules(userProfile),
        supabase.from('financial_records').select('amount, type').gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        supabase.from('stock_items').select('id, current_quantity, minimum_quantity').eq('is_active', true)
      ]);

      const clients = clientsRes.data || [];
      const employees = employeesRes.data || [];
      const schedules = schedulesRes || [];
      const financial = financialRes.data || [];
      const stock = stockRes.data || [];

      // Calculate today's appointments by status
      const pendingAppointments = schedules.filter(s => ['scheduled', 'confirmed'].includes(s.status)).length;
      const completedAppointments = schedules.filter(s => s.status === 'completed').length;
      
      // Calculate monthly revenue (income - expenses)
      const monthlyRevenue = financial.reduce((total, record) => {
        return record.type === 'income' ? total + Number(record.amount) : total - Number(record.amount);
      }, 0);

      // Calculate low stock items
      const lowStockItems = stock.filter(item => item.current_quantity <= item.minimum_quantity).length;

      const newStats: DashboardStats = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.is_active === true).length,
        todayAppointments: schedules.length,
        totalAppointments: schedules.length,
        monthlyRevenue: monthlyRevenue,
        totalEmployees: employees.length,
        lowStockItems: lowStockItems,
        pendingAppointments: pendingAppointments
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

  // Function to load today's schedules with proper filtering
  const loadTodaySchedules = async (userProfile: any) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      let query = supabase
        .from('schedules')
        .select(`
          id, title, start_time, status,
          clients (name),
          profiles (name)
        `)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time');

      // Filter based on user role
      if (userProfile) {
        const isReceptionist = ['receptionist', 'administrative'].includes(userProfile.employee_role);
        const isDirectorOrCoordinator = ['director', 'coordinator_madre', 'coordinator_floresta'].includes(userProfile.employee_role);
        
        if (!isDirectorOrCoordinator && !isReceptionist) {
          // Staff members see only their appointments
          query = query.eq('employee_id', user?.id);
        }
        // Directors, coordinators and receptionists see all appointments
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading today schedules:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error loading today schedules:', error);
      return [];
    }
  };

  // Auto refresh stats every 2 minutes
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        loadDashboardStats();
      }, 2 * 60 * 1000); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Alertas de Agendamento */}
      <ScheduleAlerts />
      
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

      {/* Quick Actions and Assignment Management */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>

        {/* Client Assignment Management - Only for Directors/Admins */}
        {(isDirector || isAdmin) && (
          <ClientAssignmentManager />
        )}

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
            <div className="text-sm">
              <strong>Segurança:</strong> <span className="text-green-600 font-medium">Políticas RLS Ativas ✓</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}