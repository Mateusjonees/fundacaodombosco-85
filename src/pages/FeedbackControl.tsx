import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle, Calendar, Clock, FileText, Plus, Search, User } from 'lucide-react';
import { format, differenceInBusinessDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeedbackControl {
  id: string;
  client_id: string;
  started_at: string;
  deadline_date: string;
  status: 'pending' | 'completed' | 'overdue';
  report_attached: boolean;
  completed_at: string | null;
  notes: string | null;
  laudo_file_path: string | null;
  assigned_to: string | null;
  clients: {
    id: string;
    name: string;
    cpf: string | null;
  };
  assigned_profiles?: {
    user_id: string;
    name: string;
  };
}

export default function FeedbackControl() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackControl | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [uploadingLaudo, setUploadingLaudo] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, [user]);

  useEffect(() => {
    if (hasPermission) {
      loadFeedbacks();
      if (isCoordinator) {
        loadClients();
        loadEmployees();
      }
    }
  }, [hasPermission, isCoordinator]);

  const checkPermissions = async () => {
    if (!user) {
      setHasPermission(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('employee_role, unit')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setHasPermission(false);
        return;
      }

      const coordinatorRoles = ['director', 'coordinator_floresta'];
      const isCoord = profile && coordinatorRoles.includes(profile.employee_role);
      setIsCoordinator(isCoord);
      
      // Diretores têm acesso total independente da unidade
      // Outros funcionários precisam ser da unidade Floresta
      if (profile.employee_role === 'director' || profile.unit === 'floresta') {
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setHasPermission(false);
    }
  };

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('client_feedback_control')
        .select(`
          *,
          clients!client_feedback_control_client_id_fkey (
            id,
            name,
            cpf
          )
        `)
        .neq('status', 'completed')
        .order('deadline_date', { ascending: true });
      
      // Se não for coordenador, mostrar apenas suas devolutivas
      if (!isCoordinator && user) {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar nomes dos funcionários atribuídos
      const feedbacksWithEmployees = await Promise.all((data || []).map(async (item) => {
        if (item.assigned_to) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, name')
            .eq('user_id', item.assigned_to)
            .single();
          
          return { ...item, assigned_profiles: profile };
        }
        return item;
      }));

      // Atualizar status se vencido
      const now = new Date();
      const updatedData = feedbacksWithEmployees.map(item => {
        const deadline = new Date(item.deadline_date);
        if (deadline < now && item.status === 'pending') {
          return { ...item, status: 'overdue' as const };
        }
        return { ...item, status: item.status as 'pending' | 'completed' | 'overdue' };
      });

      setFeedbacks(updatedData as any);
    } catch (error) {
      console.error('Erro ao carregar devolutivas:', error);
      toast.error('Erro ao carregar devolutivas');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, cpf')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Filtrar clientes que já estão em devolutiva
      const clientsInFeedback = feedbacks.map(f => f.client_id);
      const availableClients = data?.filter(c => !clientsInFeedback.includes(c.id)) || [];
      setClients(availableClients);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const addToFeedback = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    if (!selectedEmployee) {
      toast.error('Selecione um funcionário responsável');
      return;
    }

    try {
      const { error } = await supabase
        .from('client_feedback_control')
        .insert([{
          client_id: selectedClient.id,
          assigned_to: selectedEmployee,
          created_by: user?.id || '',
          notes: notes || null,
          deadline_date: new Date().toISOString().split('T')[0], // será sobrescrito pelo trigger
        }]);

      if (error) throw error;

      toast.success('Cliente adicionado ao controle de devolutiva');
      setShowAddDialog(false);
      setSelectedClient(null);
      setSelectedEmployee('');
      setNotes('');
      setClientSearchTerm('');
      loadFeedbacks();
      loadClients();
    } catch (error: any) {
      console.error('Erro ao adicionar à devolutiva:', error);
      toast.error(error.message || 'Erro ao adicionar cliente');
    }
  };

  const calculateRemainingDays = (deadlineDate: string) => {
    const deadline = new Date(deadlineDate);
    const today = new Date();
    return differenceInBusinessDays(deadline, today);
  };

  const getStatusBadge = (status: string, remainingDays: number) => {
    if (status === 'completed') {
      return <Badge variant="default" className="bg-green-600">Concluído</Badge>;
    }
    if (status === 'overdue' || remainingDays < 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    if (remainingDays <= 3) {
      return <Badge variant="secondary" className="bg-orange-500">Urgente</Badge>;
    }
    return <Badge variant="outline">Em andamento</Badge>;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!selectedFeedback) return;

    // Verificar se é coordenador ou se é o funcionário atribuído
    const canUpload = isCoordinator || (selectedFeedback.assigned_to === user?.id);
    if (!canUpload) {
      toast.error('Você não tem permissão para anexar laudos a esta devolutiva');
      return;
    }

    const file = e.target.files[0];
    
    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não permitido. Use PDF, JPG ou PNG');
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB');
      return;
    }

    try {
      setUploadingLaudo(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedFeedback.client_id}/${Date.now()}.${fileExt}`;
      
      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('laudos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Atualizar registro com o caminho do laudo
      const { error: updateError } = await supabase
        .from('client_feedback_control')
        .update({ 
          laudo_file_path: fileName,
        })
        .eq('id', selectedFeedback.id);

      if (updateError) throw updateError;

      toast.success('Laudo anexado com sucesso! Cliente movido para inativo.');
      setShowDetailsDialog(false);
      setSelectedFeedback(null);
      loadFeedbacks();
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error.message || 'Erro ao anexar laudo');
    } finally {
      setUploadingLaudo(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => 
    f.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.clients?.cpf?.includes(searchTerm)
  );

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página ou não possui devolutivas atribuídas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle de Devolutiva</h1>
          <p className="text-muted-foreground">
            {isCoordinator 
              ? 'Gerencie os prazos de entrega de laudos (15 dias úteis)'
              : 'Suas devolutivas atribuídas - Anexe os laudos para concluir'
            }
          </p>
        </div>

        {isCoordinator && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Cliente à Devolutiva</DialogTitle>
              <DialogDescription>
                Selecione o cliente que será incluído no controle de devolutiva
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Buscar Cliente</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome ou CPF do cliente..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Cliente</label>
                <select
                  className="w-full mt-1 p-2 border rounded-md bg-background"
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value);
                    setSelectedClient(client);
                  }}
                >
                  <option value="">Selecione um cliente</option>
                  {clients
                    .filter(client => 
                      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                      (client.cpf && client.cpf.includes(clientSearchTerm))
                    )
                    .map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.cpf ? `- CPF: ${client.cpf}` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Funcionário Responsável</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.user_id} value={employee.user_id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre a devolutiva..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={addToFeedback}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando devolutivas...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma devolutiva encontrada</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Tente ajustar sua busca' : 'Adicione clientes para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFeedbacks.map((feedback) => {
            const remainingDays = calculateRemainingDays(feedback.deadline_date);
            
            return (
              <Card 
                key={feedback.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedFeedback(feedback);
                  setShowDetailsDialog(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{feedback.clients?.name}</CardTitle>
                      <CardDescription>
                        {feedback.clients?.cpf && `CPF: ${feedback.clients.cpf}`}
                      </CardDescription>
                      {feedback.assigned_profiles ? (
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{feedback.assigned_profiles.name}</span>
                          </Badge>
                        </div>
                      ) : (
                        isCoordinator && (
                          <div className="flex items-center gap-2 text-sm mt-2">
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              Sem responsável
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                    {getStatusBadge(feedback.status, remainingDays)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Data de Lançamento</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(feedback.started_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Prazo Final (15 dias úteis)</p>
                        <p className="text-sm text-muted-foreground">
                          {feedback.deadline_date.split('T')[0].split('-').reverse().join('/')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contagem Regressiva em Destaque */}
                  <div className={`p-4 rounded-lg border-2 ${
                    remainingDays < 0 
                      ? 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-800' 
                      : remainingDays <= 3 
                        ? 'bg-orange-50 border-orange-300 dark:bg-orange-950 dark:border-orange-800'
                        : 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className={`h-6 w-6 ${
                          remainingDays < 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : remainingDays <= 3 
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-blue-600 dark:text-blue-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium mb-1">⏱️ Contagem Regressiva</p>
                          <p className={`text-2xl font-bold ${
                            remainingDays < 0 
                              ? 'text-red-600 dark:text-red-400' 
                              : remainingDays <= 3 
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {remainingDays < 0 
                              ? `Vencido há ${Math.abs(remainingDays)} dias úteis` 
                              : remainingDays === 0
                                ? 'Vence hoje!'
                                : `${remainingDays} ${remainingDays === 1 ? 'dia útil' : 'dias úteis'}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {feedback.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">Observações:</p>
                      <p className="text-sm text-muted-foreground">{feedback.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de Detalhes e Upload de Laudo */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Devolutiva - {selectedFeedback?.clients?.name}</DialogTitle>
            <DialogDescription>
              {isCoordinator 
                ? 'Faça o upload do laudo para concluir a devolutiva' 
                : 'Anexe o laudo para concluir sua devolutiva'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">CPF</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFeedback.clients?.cpf || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  {getStatusBadge(
                    selectedFeedback.status, 
                    calculateRemainingDays(selectedFeedback.deadline_date)
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Funcionário Responsável</p>
                {selectedFeedback.assigned_profiles ? (
                  <Badge variant="secondary" className="mt-1">
                    <User className="h-3 w-3 mr-1" />
                    {selectedFeedback.assigned_profiles.name}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Nenhum funcionário atribuído
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Data de Lançamento</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedFeedback.started_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Prazo Final (15 dias úteis)</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFeedback.deadline_date.split('T')[0].split('-').reverse().join('/')}
                  </p>
                </div>
              </div>

              {/* Contagem Regressiva em Destaque no Dialog */}
              <div className={`p-4 rounded-lg border-2 ${
                calculateRemainingDays(selectedFeedback.deadline_date) < 0 
                  ? 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-800' 
                  : calculateRemainingDays(selectedFeedback.deadline_date) <= 3 
                    ? 'bg-orange-50 border-orange-300 dark:bg-orange-950 dark:border-orange-800'
                    : 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-800'
              }`}>
                <div className="text-center">
                  <AlertCircle className={`h-6 w-6 mx-auto mb-2 ${
                    calculateRemainingDays(selectedFeedback.deadline_date) < 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : calculateRemainingDays(selectedFeedback.deadline_date) <= 3 
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <p className="text-xs font-medium mb-1">⏱️ Contagem Regressiva</p>
                  <p className={`text-2xl font-bold ${
                    calculateRemainingDays(selectedFeedback.deadline_date) < 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : calculateRemainingDays(selectedFeedback.deadline_date) <= 3 
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {calculateRemainingDays(selectedFeedback.deadline_date) < 0 
                      ? `Vencido há ${Math.abs(calculateRemainingDays(selectedFeedback.deadline_date))} dias` 
                      : calculateRemainingDays(selectedFeedback.deadline_date) === 0
                        ? '🔥 Vence hoje!'
                        : `${calculateRemainingDays(selectedFeedback.deadline_date)} ${calculateRemainingDays(selectedFeedback.deadline_date) === 1 ? 'dia útil' : 'dias úteis'}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prazo de 15 dias úteis desde o lançamento
                  </p>
                </div>
              </div>

              {selectedFeedback.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Observações</p>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">{selectedFeedback.notes}</p>
                  </div>
                </div>
              )}

              {!selectedFeedback.report_attached && (
                <>
                  {(isCoordinator || selectedFeedback.assigned_to === user?.id) ? (
                    <div className="border-2 border-dashed rounded-lg p-4">
                      <div className="text-center space-y-2">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-sm font-medium">Anexar Laudo</p>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG ou PNG (máximo 10MB)
                          </p>
                        </div>
                        <label className="cursor-pointer">
                          <Button 
                            variant="default" 
                            size="sm"
                            disabled={uploadingLaudo}
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById('laudo-upload')?.click();
                            }}
                          >
                            {uploadingLaudo ? 'Enviando...' : 'Selecionar Arquivo'}
                          </Button>
                          <input
                            id="laudo-upload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Apenas o funcionário responsável ou coordenadores podem anexar o laudo.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {selectedFeedback.report_attached && (
                <Alert className="bg-green-50 border-green-200">
                  <FileText className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Laudo anexado com sucesso! Cliente foi movido para inativo.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="flex-shrink-0 mt-4">
            <Button variant="outline" onClick={() => {
              setShowDetailsDialog(false);
              setSelectedFeedback(null);
            }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
