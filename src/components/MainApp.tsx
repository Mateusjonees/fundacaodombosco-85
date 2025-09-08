import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { LogOut, Users, Calendar, FileText, DollarSign, UserPlus } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  employee_role: string;
  phone?: string;
  document_cpf?: string;
  is_active: boolean;
  hire_date: string;
  department?: string;
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

export const MainApp = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      if (activeTab === 'employees') {
        loadEmployees();
      }
    }
  }, [user, activeTab]);

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

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading employees:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os funcionários.",
        });
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Unexpected error loading employees:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao sair",
          description: error.message,
        });
      } else {
        toast({
          title: "Logout realizado com sucesso",
          description: "Até logo!",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
      });
    }
  };

  const canViewEmployees = currentUserProfile?.employee_role === 'director' || 
                          currentUserProfile?.employee_role === 'coordinator_madre' || 
                          currentUserProfile?.employee_role === 'coordinator_floresta';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FileText },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    ...(canViewEmployees ? [{ id: 'employees', label: 'Funcionários', icon: UserPlus }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">FUNDAÇÃO DOM BOSCO</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <Badge variant="secondary" className="mb-1">
                {currentUserProfile?.name || user?.email}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {currentUserProfile?.employee_role ? ROLE_LABELS[currentUserProfile.employee_role] : 'Carregando...'}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            
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
                  Use a navegação acima para acessar as diferentes funcionalidades do sistema.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Clientes
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Cadastrados no sistema
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Consultas Hoje
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Agendamentos para hoje
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Receita Mensal
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 0,00</div>
                  <p className="text-xs text-muted-foreground">
                    Faturamento do mês
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Funcionários
                  </CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profiles.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Registrados no sistema
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'employees' && canViewEmployees && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Funcionários</h2>
              <Button onClick={loadEmployees} disabled={loading}>
                {loading ? 'Carregando...' : 'Atualizar Lista'}
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-6">
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Carregando funcionários...</p>
                ) : profiles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum funcionário encontrado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Contratação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {ROLE_LABELS[profile.employee_role] || profile.employee_role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{profile.user_id}</TableCell>
                          <TableCell>{profile.phone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={profile.is_active ? "default" : "secondary"}>
                              {profile.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {profile.hire_date ? new Date(profile.hire_date).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Clientes</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  Funcionalidade de clientes será implementada aqui.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Agenda</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  Funcionalidade de agenda será implementada aqui.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Financeiro</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  Funcionalidade financeira será implementada aqui.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};