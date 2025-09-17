import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Eye, ArrowLeft, Users, Filter, Power } from 'lucide-react';
import ClientDetailsView from '@/components/ClientDetailsView';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  medical_history?: string;
  cpf?: string;
  responsible_name?: string;
  responsible_phone?: string;
  unit?: string;
  diagnosis?: string;
  neuropsych_complaint?: string;
  treatment_expectations?: string;
  clinical_observations?: string;
  is_active: boolean;
  created_at: string;
}

interface UserProfile {
  employee_role: string;
}

export default function Clients() {
  const permissions = useRolePermissions();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [professionalFilter, setProfessionalFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const isCoordinatorOrDirector = userProfile?.employee_role === 'director' || 
                                  userProfile?.employee_role === 'coordinator_madre' || 
                                  userProfile?.employee_role === 'coordinator_floresta';

  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    birth_date: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    medical_history: '',
    cpf: '',
    responsible_name: '',
    responsible_phone: '',
    unit: 'madre',
    diagnosis: '',
    neuropsych_complaint: '',
    treatment_expectations: '',
    clinical_observations: ''
  });

  useEffect(() => {
    loadUserProfile();
    loadEmployees();
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      loadClients();
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('employee_role')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, employee_role')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadClients = async () => {
    setLoading(true);
    try {
      let query;
      
      if (isCoordinatorOrDirector) {
        // Coordenadores e diretores veem todos os clientes
        query = supabase
          .from('clients')
          .select('*')
          .order('name');
      } else {
        // Staff vê apenas clientes vinculados a ele
        query = supabase
          .from('clients')
          .select(`
            *,
            client_assignments!inner (employee_id)
          `)
          .eq('client_assignments.employee_id', user?.id)
          .eq('client_assignments.is_active', true)
          .order('name');
      }

      const { data, error } = await query;

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{
          ...newClient,
          is_active: true
        }])
        .select()
        .single();

      if (clientError) throw clientError;

      // Se não for coordenador/diretor, vincular automaticamente ao usuário atual
      if (!isCoordinatorOrDirector && clientData) {
        const { error: assignmentError } = await supabase
          .from('client_assignments')
          .insert({
            client_id: clientData.id,
            employee_id: user?.id,
            assigned_by: user?.id
          });

        if (assignmentError) {
          console.error('Error creating assignment:', assignmentError);
        }
      }

      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!",
      });
      
      setIsDialogOpen(false);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cadastrar o cliente.",
      });
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update(newClient)
        .eq('id', editingClient.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
      });
      
      setIsDialogOpen(false);
      setEditingClient(null);
      resetForm();
      loadClients();
      
      // Atualizar a visualização se o cliente está sendo visualizado
      if (selectedClient && selectedClient.id === editingClient.id) {
        setSelectedClient({ ...selectedClient, ...newClient });
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o cliente.",
      });
    }
  };

  const handleToggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: !currentStatus })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Cliente ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`,
      });
      
      loadClients();
    } catch (error) {
      console.error('Error toggling client status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do cliente.",
      });
    }
  };

  const resetForm = () => {
    setNewClient({
      name: '',
      phone: '',
      email: '',
      birth_date: '',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      medical_history: '',
      cpf: '',
      responsible_name: '',
      responsible_phone: '',
      unit: 'madre',
      diagnosis: '',
      neuropsych_complaint: '',
      treatment_expectations: '',
      clinical_observations: ''
    });
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setNewClient({
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      birth_date: client.birth_date || '',
      address: client.address || '',
      emergency_contact: client.emergency_contact || '',
      emergency_phone: client.emergency_phone || '',
      medical_history: client.medical_history || '',
      cpf: client.cpf || '',
      responsible_name: client.responsible_name || '',
      responsible_phone: client.responsible_phone || '',
      unit: client.unit || 'madre',
      diagnosis: client.diagnosis || '',
      neuropsych_complaint: client.neuropsych_complaint || '',
      treatment_expectations: client.treatment_expectations || '',
      clinical_observations: client.clinical_observations || ''
    });
    setIsDialogOpen(true);
  };

  const filteredClients = clients.filter(client => {
    // Enhanced search filter - ID, CPF, Name, Phone
    const matchesSearch = searchTerm === '' || 
      client.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Unit filter
    const matchesUnit = unitFilter === 'all' || client.unit === unitFilter;

    // Age filter
    let matchesAge = true;
    if (ageFilter !== 'all' && client.birth_date) {
      const birthDate = new Date(client.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (ageFilter === 'minor') {
        matchesAge = age < 18;
      } else if (ageFilter === 'adult') {
        matchesAge = age >= 18;
      }
    }

    // Professional filter (only for coordinators/directors)
    let matchesProfessional = true;
    if (professionalFilter !== 'all' && isCoordinatorOrDirector) {
      // This would require checking client assignments
      // For now, we'll keep it simple
      matchesProfessional = true;
    }

    return matchesSearch && matchesUnit && matchesAge && matchesProfessional;
  });

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Se um cliente está selecionado, mostrar a visualização detalhada
  if (selectedClient) {
    return (
      <ClientDetailsView
        client={selectedClient}
        onEdit={() => openEditDialog(selectedClient)}
        onBack={() => {
          setSelectedClient(null);
        }}
        onRefresh={loadClients}
      />
    );
  }

  return (
    <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Lista de Clientes</h1>
                  <p className="text-muted-foreground">
                    {isCoordinatorOrDirector 
                      ? 'Visualizando todos os clientes' 
                      : 'Visualizando apenas clientes vinculados a você'
                    }
                  </p>
                </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingClient(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full md:w-auto">
                  <Plus className="h-4 w-4" />
                  Cadastrar Cliente
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={newClient.cpf}
                  onChange={(e) => setNewClient({ ...newClient, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={newClient.birth_date}
                  onChange={(e) => setNewClient({ ...newClient, birth_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade de Atendimento</Label>
                <Select value={newClient.unit} onValueChange={(value) => setNewClient({ ...newClient, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="madre">Clínica Social (Madre)</SelectItem>
                    <SelectItem value="floresta">Neuro (Floresta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isCoordinatorOrDirector && (
                <div className="space-y-2">
                  <Label htmlFor="client_role">Vincular como</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente Regular</SelectItem>
                      <SelectItem value="director">Diretor</SelectItem>
                      <SelectItem value="coordinator">Coordenador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="responsible_name">Nome do Responsável</Label>
                <Input
                  id="responsible_name"
                  value={newClient.responsible_name}
                  onChange={(e) => setNewClient({ ...newClient, responsible_name: e.target.value })}
                  placeholder="Nome do responsável (se menor de idade)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsible_phone">Telefone do Responsável</Label>
                <Input
                  id="responsible_phone"
                  value={newClient.responsible_phone}
                  onChange={(e) => setNewClient({ ...newClient, responsible_phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade, estado, CEP"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="diagnosis">Diagnóstico Principal</Label>
                <Input
                  id="diagnosis"
                  value={newClient.diagnosis}
                  onChange={(e) => setNewClient({ ...newClient, diagnosis: e.target.value })}
                  placeholder="Diagnóstico médico ou neurológico"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="medical_history">Histórico Médico Relevante</Label>
                <Textarea
                  id="medical_history"
                  value={newClient.medical_history}
                  onChange={(e) => setNewClient({ ...newClient, medical_history: e.target.value })}
                  placeholder="Doenças pré-existentes, cirurgias, medicamentos"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="neuropsych_complaint">Queixa Principal Neuropsicológica</Label>
                <Textarea
                  id="neuropsych_complaint"
                  value={newClient.neuropsych_complaint}
                  onChange={(e) => setNewClient({ ...newClient, neuropsych_complaint: e.target.value })}
                  placeholder="Relato do cliente/responsável sobre as dificuldades"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="treatment_expectations">Expectativas do Tratamento</Label>
                <Textarea
                  id="treatment_expectations"
                  value={newClient.treatment_expectations}
                  onChange={(e) => setNewClient({ ...newClient, treatment_expectations: e.target.value })}
                  placeholder="O que o cliente/família espera do acompanhamento"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clinical_observations">Observações Gerais</Label>
                <Textarea
                  id="clinical_observations"
                  value={newClient.clinical_observations}
                  onChange={(e) => setNewClient({ ...newClient, clinical_observations: e.target.value })}
                  placeholder="Observações gerais sobre o cliente"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={editingClient ? handleUpdateClient : handleCreateClient} 
                disabled={!newClient.name}
              >
                {editingClient ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

            {/* Filters Section */}
            <Card className="bg-muted/50 border-muted">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Unidade:</Label>
                    <Select value={unitFilter} onValueChange={setUnitFilter}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Todas as Unidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Unidades</SelectItem>
                        <SelectItem value="madre">Clínica Social (Madre)</SelectItem>
                        <SelectItem value="floresta">Neuro (Floresta)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Idade:</Label>
                    <Select value={ageFilter} onValueChange={setAgeFilter}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Todas as Idades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Idades</SelectItem>
                        <SelectItem value="minor">Menor de Idade</SelectItem>
                        <SelectItem value="adult">Maior de Idade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {isCoordinatorOrDirector && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Profissional:</Label>
                      <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Todos os Profissionais" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Profissionais</SelectItem>
                          {employees.map(employee => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredClients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredClients.filter(c => c.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">
              {filteredClients.filter(c => !c.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
              <CardHeader>
                <CardTitle>Lista de Clientes</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por ID, nome, CPF, telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={unitFilter} onValueChange={setUnitFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Unidades</SelectItem>
                        <SelectItem value="madre">Madre</SelectItem>
                        <SelectItem value="floresta">Floresta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando clientes...</p>
          ) : filteredClients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? 'Nenhum cliente encontrado com o termo de busca.' : 'Nenhum cliente cadastrado.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client.unit === 'madre' ? 'Madre' : 'Floresta'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                     <TableCell>
                       <div className="flex gap-2">
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => setSelectedClient(client)}
                         >
                           <Eye className="h-3 w-3" />
                         </Button>
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => openEditDialog(client)}
                         >
                           <Edit className="h-3 w-3" />
                         </Button>
                         {(permissions.canViewAllClients || permissions.canCreateClients) && (
                           <Button 
                             variant={client.is_active ? "destructive" : "default"}
                             size="sm"
                             onClick={() => handleToggleClientStatus(client.id, client.is_active)}
                           >
                             <Power className="h-3 w-3" />
                           </Button>
                         )}
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}