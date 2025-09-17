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
  Calendar as CalendarIcon, 
  Phone, 
  MapPin, 
  User, 
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface Schedule {
  id: string;
  client_id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  title: string;
  status: string;
  notes?: string;
  clients?: { name: string };
}

const MyPatients: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const permissions = useRolePermissions();
  const [clients, setClients] = useState<Client[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    // Permitir acesso para todos os usuários autenticados
    if (!user) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você precisa estar logado para ver esta página.",
      });
      return;
    }

    loadMyPatients();
    loadMySchedules();
  }, [user, selectedDate]);

  const loadMySchedules = async () => {
    if (!user) return;

    try {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

      let query = supabase
        .from('schedules')
        .select(`
          id,
          client_id,
          employee_id,
          start_time,
          end_time,
          title,
          status,
          notes,
          clients (name)
        `)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time');

      // Para todos os usuários, filtrar apenas agendamentos dos clientes vinculados
      const { data: assignedClients } = await supabase
        .from('client_assignments')
        .select('client_id')
        .eq('employee_id', user.id)
        .eq('is_active', true);

      if (!assignedClients || assignedClients.length === 0) {
        setSchedules([]);
        return;
      }

      const clientIds = assignedClients.map(a => a.client_id);
      
      query = query.in('client_id', clientIds);

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadMyPatients = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Para todos os usuários, apenas clientes vinculados através de client_assignments
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
      
      // Extrair os dados dos clientes
      const clientsData = (data || [])
        .filter(assignment => assignment.clients)
        .map(assignment => assignment.clients)
        .filter(Boolean) as Client[];

      setClients(clientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar pacientes",
        description: "Não foi possível carregar a lista de pacientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const daysSinceLastSession = (dateString?: string) => {
    if (!dateString) return null;
    const today = new Date();
    const lastSession = new Date(dateString);
    const diffTime = Math.abs(today.getTime() - lastSession.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'no_show': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'no_show': return 'Faltou';
      default: return status;
    }
  };

  const getDaySchedules = (date: Date) => {
    return schedules.filter(schedule => 
      isSameDay(new Date(schedule.start_time), date)
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = direction === 'prev' 
      ? subDays(currentWeekStart, 7)
      : addDays(currentWeekStart, 7);
    setCurrentWeekStart(newWeekStart);
    setSelectedDate(newWeekStart);
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.responsible_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="text-lg">Carregando pacientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {selectedClient ? (
        <div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedClient(null)}
            className="mb-4"
          >
            ← Voltar para Lista
          </Button>
          <ClientDetailsView 
            client={selectedClient} 
            onEdit={() => {}} 
            onRefresh={() => loadMyPatients()}
          />
        </div>
      ) : (
        <>
          {/* Cabeçalho */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Meus Pacientes</h1>
              <p className="text-muted-foreground">
                Gerencie seus pacientes e visualize a agenda da semana
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2 w-fit">
              {filteredClients.length} paciente{filteredClients.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Agenda Semanal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Agenda da Semana
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[200px] text-center">
                    {format(currentWeekStart, "dd/MM", { locale: ptBR })} - {format(addDays(currentWeekStart, 6), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {getWeekDays().map((day) => {
                  const daySchedules = getDaySchedules(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={day.toDateString()} 
                      className={`p-3 border rounded-lg ${isToday ? 'bg-primary/5 border-primary' : 'bg-background'}`}
                    >
                      <div className="text-center mb-3">
                        <div className={`font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                          {format(day, 'EEE', { locale: ptBR })}
                        </div>
                        <div className={`text-2xl font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                          {format(day, 'dd', { locale: ptBR })}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {daySchedules.length === 0 ? (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            Nenhum agendamento
                          </div>
                        ) : (
                          daySchedules.map((schedule) => (
                            <div 
                              key={schedule.id} 
                              className="p-2 bg-background border rounded text-xs"
                            >
                              <div className="font-medium text-primary">
                                {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })}
                              </div>
                              <div className="text-foreground truncate">
                                {schedule.clients?.name || 'Cliente N/A'}
                              </div>
                              <Badge 
                                variant={getStatusColor(schedule.status)} 
                                className="text-xs mt-1"
                              >
                                {getStatusLabel(schedule.status)}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

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
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyPatients;