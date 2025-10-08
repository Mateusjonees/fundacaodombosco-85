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
import { toast } from 'sonner';
import { AlertCircle, Calendar, Clock, FileText, Plus, Search } from 'lucide-react';
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
  clients: {
    id: string;
    name: string;
    cpf: string | null;
  };
}

export default function FeedbackControl() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  useEffect(() => {
    checkPermissions();
  }, [user]);

  useEffect(() => {
    if (hasPermission) {
      loadFeedbacks();
      loadClients();
    }
  }, [hasPermission]);

  const checkPermissions = async () => {
    if (!user) {
      setHasPermission(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('employee_role')
        .eq('user_id', user.id)
        .single();

      const allowedRoles = ['director', 'coordinator_floresta'];
      setHasPermission(profile && allowedRoles.includes(profile.employee_role));
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setHasPermission(false);
    }
  };

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_feedback_control')
        .select(`
          *,
          clients (
            id,
            name,
            cpf
          )
        `)
        .order('deadline_date', { ascending: true });

      if (error) throw error;

      // Atualizar status se vencido
      const now = new Date();
      const updatedData = (data || []).map(item => {
        const deadline = new Date(item.deadline_date);
        if (deadline < now && item.status === 'pending') {
          return { ...item, status: 'overdue' as const };
        }
        return { ...item, status: item.status as 'pending' | 'completed' | 'overdue' };
      });

      setFeedbacks(updatedData as FeedbackControl[]);
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

  const addToFeedback = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    try {
      const { error } = await supabase
        .from('client_feedback_control')
        .insert([{
          client_id: selectedClient.id,
          created_by: user?.id || '',
          notes: notes || null,
          deadline_date: new Date().toISOString().split('T')[0], // será sobrescrito pelo trigger
        }]);

      if (error) throw error;

      toast.success('Cliente adicionado ao controle de devolutiva');
      setShowAddDialog(false);
      setSelectedClient(null);
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
            Você não tem permissão para acessar esta página. Apenas coordenadores da Floresta e diretores podem gerenciar devolutivas.
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
            Gerencie os prazos de entrega de laudos (15 dias úteis)
          </p>
        </div>

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
              <Card key={feedback.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{feedback.clients?.name}</CardTitle>
                      <CardDescription>
                        {feedback.clients?.cpf && `CPF: ${feedback.clients.cpf}`}
                      </CardDescription>
                    </div>
                    {getStatusBadge(feedback.status, remainingDays)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Data de Início</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(feedback.started_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Prazo</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(feedback.deadline_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertCircle className={`h-4 w-4 ${remainingDays < 0 ? 'text-destructive' : remainingDays <= 3 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="text-sm font-medium">Dias Restantes</p>
                        <p className={`text-sm font-semibold ${remainingDays < 0 ? 'text-destructive' : remainingDays <= 3 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                          {remainingDays < 0 ? 'Vencido' : `${remainingDays} dias úteis`}
                        </p>
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
    </div>
  );
}
