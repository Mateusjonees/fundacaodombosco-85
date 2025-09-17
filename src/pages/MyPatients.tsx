import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { 
  Heart, 
  Search, 
  Calendar, 
  Phone, 
  MapPin, 
  User, 
  Clock,
  AlertCircle
} from 'lucide-react';
import ClientDetailsView from '@/components/ClientDetailsView';

interface Client {
  id: string;
  name: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  unit?: string;
  responsible_name?: string;
  responsible_phone?: string;
  is_active: boolean;
  last_session_date?: string;
  created_at: string;
}

const MyPatients: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const permissions = useRolePermissions();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!permissions.canViewMyPatients()) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você não tem permissão para ver esta página.",
      });
      return;
    }

    loadMyPatients();
  }, [user, permissions]);

  const loadMyPatients = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Se for diretor, pode ver todos os clientes
      if (permissions.isDirector()) {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        setClients(data || []);
      } else {
        // Para profissionais, apenas clientes vinculados
        const { data, error } = await supabase
          .from('client_assignments')
          .select(`
            client_id,
            clients (
              id,
              name,
              birth_date,
              phone,
              address,
              unit,
              responsible_name,
              responsible_phone,
              is_active,
              last_session_date,
              created_at
            )
          `)
          .eq('employee_id', user.id)
          .eq('is_active', true)
          .eq('clients.is_active', true);

        if (error) throw error;
        
        const myClients = data?.map(assignment => assignment.clients).filter(Boolean) || [];
        setClients(myClients);
      }
    } catch (error) {
      console.error('Erro ao carregar meus pacientes:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar lista de pacientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.responsible_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const daysSinceLastSession = (lastSessionDate?: string) => {
    if (!lastSessionDate) return null;
    const today = new Date();
    const lastSession = new Date(lastSessionDate);
    const diffTime = Math.abs(today.getTime() - lastSession.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  if (!permissions.canViewMyPatients()) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <h3 className="mt-2 text-lg font-semibold">Acesso Negado</h3>
              <p className="text-muted-foreground">
                Você não tem permissão para visualizar esta página.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedClient) {
    return (
      <ClientDetailsView
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onEdit={() => {
          setSelectedClient(null);
          loadMyPatients();
        }}
        onRefresh={loadMyPatients}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            Meus Pacientes
          </h1>
          <p className="text-muted-foreground">
            {permissions.isDirector() 
              ? "Todos os pacientes do sistema" 
              : "Pacientes sob seus cuidados"
            }
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {filteredClients.length} paciente{filteredClients.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Barra de Pesquisa */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar por nome do paciente ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pacientes */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">
                {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente vinculado'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Tente ajustar os termos de pesquisa.'
                  : 'Entre em contato com a coordenação para vincular pacientes.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const age = calculateAge(client.birth_date);
            const daysSince = daysSinceLastSession(client.last_session_date);
            const isMinor = age !== null && age < 18;

            return (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <Badge 
                      variant={client.unit === 'madre' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {client.unit === 'madre' ? 'Madre' : 'Floresta'}
                    </Badge>
                  </div>
                  {age !== null && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {age} anos {isMinor && '(Menor)'}
                      </span>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Contato */}
                  {(client.phone || client.responsible_phone) && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {isMinor && client.responsible_phone 
                          ? client.responsible_phone 
                          : client.phone || 'Não informado'
                        }
                      </span>
                    </div>
                  )}

                  {/* Responsável (apenas para menores) */}
                  {isMinor && client.responsible_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Resp.: {client.responsible_name}</span>
                    </div>
                  )}

                  {/* Endereço */}
                  {client.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {client.address}
                      </span>
                    </div>
                  )}

                  {/* Última sessão */}
                  {client.last_session_date && daysSince !== null && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Última sessão: {daysSince} dia{daysSince !== 1 ? 's' : ''} atrás
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedClient(client)}
                      className="flex-1"
                    >
                      Ver Detalhes
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // Navegar para agendamento
                        window.location.href = `/schedule?client=${client.id}`;
                      }}
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyPatients;