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
import { AlertCircle, Calendar, Clock, FileText, Plus, Search, User, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format, addDays, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTodayLocalISODate } from '@/lib/utils';

// Função para calcular 15 dias úteis a partir de uma data
const calculateBusinessDaysDeadline = (startDate: Date, businessDays: number = 15): Date => {
  let currentDate = addDays(startDate, 1); // Começa a partir do dia seguinte
  let daysAdded = 0;
  
  while (daysAdded < businessDays) {
    // Pula sábados (6) e domingos (0)
    if (!isWeekend(currentDate)) {
      daysAdded++;
    }
    
    // Se ainda não completou os dias úteis, avança para o próximo dia
    if (daysAdded < businessDays) {
      currentDate = addDays(currentDate, 1);
    }
  }
  
  return currentDate;
};

/**
 * Calcula a diferença em dias úteis entre duas datas (formato YYYY-MM-DD)
 * Retorna positivo se ainda há dias restantes, negativo se vencido
 */
const calculateBusinessDaysDifference = (deadlineDateStr: string): number => {
  // Obter data de hoje no formato local
  const todayStr = getTodayLocalISODate();
  
  // Parse das datas como componentes locais (evita problemas de timezone)
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
  const [deadYear, deadMonth, deadDay] = deadlineDateStr.split('-').map(Number);
  
  const today = new Date(todayYear, todayMonth - 1, todayDay);
  const deadline = new Date(deadYear, deadMonth - 1, deadDay);
  
  // Se a data é igual, retorna 0
  if (todayStr === deadlineDateStr) return 0;
  
  // Determinar direção da contagem
  const isOverdue = today > deadline;
  const startDate = isOverdue ? deadline : today;
  const endDate = isOverdue ? today : deadline;
  
  let businessDays = 0;
  let currentDate = new Date(startDate);
  
  // Avançar um dia para começar a contar
  currentDate.setDate(currentDate.getDate() + 1);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Se vencido, retorna negativo
  return isOverdue ? -businessDays : businessDays;
};

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
    diagnosis: string | null;
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
  const [isDirector, setIsDirector] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackControl | null>(null);
  const [deleting, setDeleting] = useState(false);
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
  const [diagnosisInput, setDiagnosisInput] = useState('');

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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasPermission(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('employee_role, is_active')
        .eq('user_id', user.id)
        .single();

      if (!profile || !profile.is_active) {
        setHasPermission(false);
        return;
      }

      // Todos os funcionários ativos têm acesso à página
      setHasPermission(true);
      
      // Apenas coordenadores e diretores podem adicionar clientes
      const isManager = profile.employee_role === 'director' || 
                       profile.employee_role === 'coordinator_floresta' ||
                       profile.employee_role === 'coordinator_atendimento_floresta';
      setIsCoordinator(isManager);
      setIsDirector(profile.employee_role === 'director');
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setHasPermission(false);
    }
  };

  // Exclusão de devolutiva — restrito a diretores
  const handleDeleteFeedback = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('client_feedback_control')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Devolutiva excluída com sucesso');
      setDeleteTarget(null);
      loadFeedbacks();
    } catch (error: any) {
      console.error('Erro ao excluir devolutiva:', error);
      toast.error('Não foi possível excluir a devolutiva');
    } finally {
      setDeleting(false);
    }
  };

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      
      // Buscar user diretamente para garantir que está disponível
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      console.log('🔍 [DEBUG] User no loadFeedbacks:', currentUser?.id);
      console.log('🔍 [DEBUG] isCoordinator:', isCoordinator);
      
      if (!currentUser) {
        console.error('❌ Usuário não autenticado');
        toast.error('Usuário não autenticado');
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from('client_feedback_control')
        .select(`
          *,
          clients!client_feedback_control_client_id_fkey (
            id,
            name,
            cpf,
            diagnosis
          )
        `)
        .neq('status', 'completed')
        .order('deadline_date', { ascending: true });
      
      // Se não for coordenador, mostrar apenas suas devolutivas
      if (!isCoordinator) {
        console.log('🔍 [DEBUG] Aplicando filtro assigned_to:', currentUser.id);
        query = query.eq('assigned_to', currentUser.id);
      } else {
        console.log('🔍 [DEBUG] Coordenador - sem filtro assigned_to');
      }

      const { data, error } = await query;
      
      console.log('🔍 [DEBUG] Registros retornados:', data?.length || 0);
      console.log('🔍 [DEBUG] Dados:', data);

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
      // Calcular o prazo de 15 dias úteis a partir de hoje
      const today = new Date();
      const deadlineDate = calculateBusinessDaysDeadline(today, 15);
      const deadlineDateString = format(deadlineDate, 'yyyy-MM-dd');
      
      console.log('🗓️ Data de início:', format(today, 'dd/MM/yyyy'));
      console.log('🗓️ Prazo calculado (15 dias úteis):', format(deadlineDate, 'dd/MM/yyyy'));

      const { data: insertedData, error } = await supabase
        .from('client_feedback_control')
        .insert([{
          client_id: selectedClient.id,
          assigned_to: selectedEmployee,
          created_by: user?.id || '',
          notes: notes || null,
          deadline_date: deadlineDateString,
        }])
        .select()
        .single();

      if (error) throw error;

      // Criar notificação para o funcionário vinculado
      const employeeName = employees.find(e => e.user_id === selectedEmployee)?.name || 'Funcionário';
      
      await supabase
        .from('notifications')
        .insert([{
          user_id: selectedEmployee,
          title: '📋 Nova Devolutiva Atribuída',
          message: `Você foi designado para a devolutiva do paciente ${selectedClient.name}. Prazo: ${format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR })} (15 dias úteis).`,
          type: 'feedback_control',
          is_read: false,
        }]);

      toast.success(`Cliente adicionado! Prazo: ${format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR })}`);
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
    // Extrair apenas a parte da data (YYYY-MM-DD)
    const datePart = deadlineDate.split('T')[0];
    return calculateBusinessDaysDifference(datePart);
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

    // Verificar se diagnóstico foi preenchido
    if (!diagnosisInput.trim()) {
      toast.error('Por favor, preencha o diagnóstico antes de anexar o laudo');
      return;
    }

    const file = e.target.files[0];
    
    // Validar tipo de arquivo - agora aceita mais formatos
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/plain', // .txt
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não permitido. Use PDF, JPG, PNG, DOC, DOCX, XLS, XLSX ou TXT');
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

      // Atualizar o diagnóstico no cliente
      const { error: clientError } = await supabase
        .from('clients')
        .update({ diagnosis: diagnosisInput.trim() })
        .eq('id', selectedFeedback.client_id);

      if (clientError) throw clientError;

      // Atualizar registro com o caminho do laudo e marcar como completo
      const { error: updateError } = await supabase
        .from('client_feedback_control')
        .update({ 
          laudo_file_path: fileName,
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
          report_attached: true,
        })
        .eq('id', selectedFeedback.id);

      if (updateError) throw updateError;

      toast.success('Laudo anexado e diagnóstico salvo com sucesso!');
      setShowDetailsDialog(false);
      setSelectedFeedback(null);
      setDiagnosisInput('');
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
    <div className="w-full p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-1.5 bg-gradient-to-b from-orange-500 via-orange-600 to-red-600 rounded-full" />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Controle de Devolutiva
            </h1>
            <p className="text-muted-foreground mt-1">
              {isCoordinator 
                ? 'Gerencie os prazos de entrega de laudos (15 dias úteis)'
                : 'Suas devolutivas atribuídas - Anexe os laudos para concluir'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
            <Clock className="h-4 w-4 mr-2" />
            {filteredFeedbacks.length} pendente{filteredFeedbacks.length !== 1 ? 's' : ''}
          </Badge>
          
          {isCoordinator && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                  <Plus className="h-4 w-4" />
                  Adicionar
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
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-orange-500/5">
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-500" />
            <Input
              placeholder="🔍 Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-background/50 border-orange-500/20 focus:border-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando devolutivas...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full mb-4">
              <FileText className="h-16 w-16 text-orange-500" />
            </div>
            <p className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
              Nenhuma devolutiva encontrada
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm ? 'Tente ajustar sua busca' : 'Adicione clientes para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredFeedbacks.map((feedback) => {
            const remainingDays = calculateRemainingDays(feedback.deadline_date);
            const isOverdue = remainingDays < 0;
            const isUrgent = remainingDays <= 3 && remainingDays >= 0;
            
            return (
              <Card 
                key={feedback.id} 
                className={`group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg overflow-hidden ${
                  isOverdue 
                    ? 'bg-gradient-to-br from-red-500/5 via-card to-card border-l-4 border-l-red-500' 
                    : isUrgent 
                      ? 'bg-gradient-to-br from-orange-500/5 via-card to-card border-l-4 border-l-orange-500'
                      : 'bg-gradient-to-br from-card via-card to-blue-500/5 border-l-4 border-l-blue-500'
                }`}
                onClick={() => {
                  setSelectedFeedback(feedback);
                  setShowDetailsDialog(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-1">{feedback.clients?.name}</CardTitle>
                      <CardDescription>
                        {feedback.clients?.cpf && `CPF: ${feedback.clients.cpf}`}
                      </CardDescription>
                      {feedback.clients?.diagnosis && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Diagnóstico:</span> {feedback.clients.diagnosis}
                        </p>
                      )}
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
                    <div className="flex items-center gap-1 shrink-0">
                      {getStatusBadge(feedback.status, remainingDays)}
                      {isDirector && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground/60 hover:text-destructive"
                          title="Excluir devolutiva"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(feedback); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
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
              
              {selectedFeedback.clients?.diagnosis && (
                <div>
                  <p className="text-sm font-medium">Diagnóstico</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFeedback.clients.diagnosis}
                  </p>
                </div>
              )}
              
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
                      ? `Vencido há ${Math.abs(calculateRemainingDays(selectedFeedback.deadline_date))} dias úteis` 
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
                    <div className="space-y-4">
                      {/* Campo de Diagnóstico Obrigatório */}
                      <div className="border-2 border-primary/30 rounded-lg p-4 bg-primary/5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <span className="text-red-500">*</span>
                            Diagnóstico do Paciente
                          </label>
                          <Textarea
                            value={diagnosisInput}
                            onChange={(e) => setDiagnosisInput(e.target.value)}
                            placeholder="Digite o diagnóstico do paciente..."
                            rows={3}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            Este diagnóstico será salvo no cadastro do paciente ao anexar o laudo.
                          </p>
                        </div>
                      </div>

                      {/* Área de Upload do Laudo */}
                      <div className={`border-2 border-dashed rounded-lg p-4 ${!diagnosisInput.trim() ? 'opacity-50' : ''}`}>
                        <div className="text-center space-y-2">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                          <div>
                            <p className="text-sm font-medium">Anexar Laudo</p>
                            <p className="text-xs text-muted-foreground">
                              PDF, JPG, PNG, DOC, DOCX, XLS, XLSX ou TXT (máximo 10MB)
                            </p>
                          </div>
                          <label className="cursor-pointer">
                            <Button 
                              variant="default" 
                              size="sm"
                              disabled={uploadingLaudo || !diagnosisInput.trim()}
                              onClick={(e) => {
                                e.preventDefault();
                                if (!diagnosisInput.trim()) {
                                  toast.error('Preencha o diagnóstico antes de anexar o laudo');
                                  return;
                                }
                                document.getElementById('laudo-upload')?.click();
                              }}
                            >
                              {uploadingLaudo ? 'Enviando...' : 'Selecionar Arquivo'}
                            </Button>
                            <input
                              id="laudo-upload"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                          {!diagnosisInput.trim() && (
                            <p className="text-xs text-amber-600 font-medium">
                              ⚠️ Preencha o diagnóstico acima antes de anexar o laudo
                            </p>
                          )}
                        </div>
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
