import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Calendar, Download, Filter, FileText, StickyNote, Shield, Edit2, Trash2, Info, AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useCustomPermissions } from '@/hooks/useCustomPermissions';
import { EditFinancialRecordDialog } from '@/components/EditFinancialRecordDialog';
import { FinancialProjection } from '@/components/FinancialProjection';
import { DefaultManagementPanel } from '@/components/DefaultManagementPanel';
import { CostCenterAnalysis } from '@/components/CostCenterAnalysis';
import { PaymentReceiptGenerator } from '@/components/PaymentReceiptGenerator';

interface FinancialRecord {
  id: string;
  type: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  payment_method?: string;
  client_id?: string;
  created_at: string;
  notes?: string;
  clients?: { name: string };
}

interface FinancialNote {
  id: string;
  note_date: string;
  note_text: string;
  note_type: string;
  created_at: string;
  profiles?: { name: string };
}

export default function Financial() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [notes, setNotes] = useState<FinancialNote[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [unitFilter, setUnitFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [showContractPending, setShowContractPending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { userRole, loading: roleLoading } = useRolePermissions();
  const customPermissions = useCustomPermissions();

  const [newRecord, setNewRecord] = useState({
    type: 'income',
    category: 'consultation', // Valor padrão válido para income
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    client_id: ''
  });

  const [newNote, setNewNote] = useState({
    note_date: new Date().toISOString().split('T')[0],
    note_text: '',
    note_type: 'daily'
  });

  useEffect(() => {
    if (roleLoading || customPermissions.loading) return;
    
    // Verificar permissão: apenas diretor
    const hasAccess = userRole === 'director' || 
                      customPermissions.hasPermission('view_financial');
    
    if (!hasAccess) {
      toast({
        variant: "destructive",
        title: "Acesso Restrito",
        description: "Apenas diretores têm acesso ao sistema financeiro."
      });
      return;
    }
    
    loadFinancialRecords();
    loadFinancialNotes();
    loadPendingPayments();
  }, [roleLoading, userRole, customPermissions.loading]);

  const loadFinancialRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          clients (name, unit)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading financial records:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os registros financeiros.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_notes')
        .select('*')
        .order('note_date', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading financial notes:', error);
    }
  };

  const loadPendingPayments = async () => {
    try {
      // Buscar TODOS os pagamentos (todas unidades, todos status)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('client_payments')
        .select(`
          id,
          client_id,
          total_amount,
          amount_paid,
          amount_remaining,
          payment_type,
          payment_method,
          installments_total,
          installments_paid,
          credit_card_installments,
          down_payment_amount,
          down_payment_method,
          payment_combination,
          status,
          due_date,
          description,
          notes,
          unit,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Buscar parcelas de cada pagamento
      const paymentIds = (paymentsData || []).map(p => p.id);
      const { data: installmentsData, error: installmentsError } = await supabase
        .from('payment_installments')
        .select(`
          id,
          client_payment_id,
          installment_number,
          amount,
          paid_amount,
          due_date,
          status,
          payment_method,
          paid_at,
          notes
        `)
        .in('client_payment_id', paymentIds.length > 0 ? paymentIds : ['none'])
        .order('installment_number', { ascending: true });

      if (installmentsError) throw installmentsError;

      // Buscar informações dos clientes
      const allClientIds = [...new Set((paymentsData || []).map(p => p.client_id).filter(Boolean))];
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, phone, email, unit, cpf')
        .in('id', allClientIds.length > 0 ? allClientIds : ['none']);

      const clientsMap = (clientsData || []).reduce((acc: Record<string, any>, client: any) => {
        acc[client.id] = client;
        return acc;
      }, {});

      // Agrupar parcelas por pagamento
      const installmentsByPayment = (installmentsData || []).reduce((acc: Record<string, any[]>, inst: any) => {
        if (!acc[inst.client_payment_id]) acc[inst.client_payment_id] = [];
        acc[inst.client_payment_id].push(inst);
        return acc;
      }, {});

      // Combinar dados completos
      const enrichedPayments = (paymentsData || []).map(payment => ({
        ...payment,
        client: clientsMap[payment.client_id] || null,
        installments: installmentsByPayment[payment.id] || [],
      }));

      setPendingPayments(enrichedPayments);
    } catch (error) {
      console.error('Error loading pending payments:', error);
    }
  };

  const handleCreateRecord = async () => {
    try {
      const { error } = await supabase
        .from('financial_records')
        .insert([{
          ...newRecord,
          amount: parseFloat(newRecord.amount),
          client_id: newRecord.client_id || null,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro financeiro criado com sucesso!",
      });
      
      setIsDialogOpen(false);
      setNewRecord({
        type: 'income',
        category: 'consultation', // Valor padrão válido para income
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        client_id: ''
      });
      loadFinancialRecords();
    } catch (error) {
      console.error('Error creating financial record:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o registro financeiro.",
      });
    }
  };

  const handleCreateNote = async () => {
    try {
      const { error } = await supabase
        .from('financial_notes')
        .insert([{
          ...newNote,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Nota adicionada com sucesso!",
      });
      
      setIsNoteDialogOpen(false);
      setNewNote({
        note_date: new Date().toISOString().split('T')[0],
        note_text: '',
        note_type: 'daily'
      });
      loadFinancialNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar a nota.",
      });
    }
  };

  const handleEditRecord = (record: FinancialRecord) => {
    setEditingRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('financial_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro financeiro excluído com sucesso!"
      });

      loadFinancialRecords();
    } catch (error) {
      console.error('Error deleting financial record:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o registro financeiro."
      });
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDateRange = (!dateFilter.start || record.date >= dateFilter.start) &&
      (!dateFilter.end || record.date <= dateFilter.end);
    
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    
    const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter;
    
    const matchesAmount = (!amountFilter.min || record.amount >= parseFloat(amountFilter.min)) &&
      (!amountFilter.max || record.amount <= parseFloat(amountFilter.max));
    
    const matchesUnit = unitFilter === 'all' || 
      (record.clients && 'unit' in record.clients && record.clients.unit === unitFilter);
    
    const matchesPaymentMethod = paymentMethodFilter === 'all' || record.payment_method === paymentMethodFilter;
    
    const matchesContractPending = !showContractPending || record.payment_method === 'contract';
    
    return matchesSearch && matchesDateRange && matchesType && matchesCategory && matchesAmount && matchesUnit && matchesPaymentMethod && matchesContractPending;
  });

  const incomeRecords = filteredRecords.filter(r => r.type === 'income');
  const expenseRecords = filteredRecords.filter(r => r.type === 'expense');

  const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Check if filters are active (not default month)
  const hasActiveFilters = dateFilter.start || dateFilter.end || typeFilter !== 'all' || 
    categoryFilter !== 'all' || amountFilter.min || amountFilter.max || 
    unitFilter !== 'all' || paymentMethodFilter !== 'all' || searchTerm;

  // Period label
  const periodLabel = hasActiveFilters 
    ? (dateFilter.start && dateFilter.end 
        ? `${new Date(dateFilter.start + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(dateFilter.end + 'T12:00:00').toLocaleDateString('pt-BR')}`
        : 'Filtros ativos')
    : `Mês atual (${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})`;

  // Current month calculations - only used when no filters active
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  const currentMonthIncome = currentMonthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const currentMonthExpenses = currentMonthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);

  // Display values: use filteredRecords when filters are active, otherwise current month
  const displayIncome = hasActiveFilters ? totalIncome : currentMonthIncome;
  const displayExpenses = hasActiveFilters ? totalExpenses : currentMonthExpenses;
  const displayBalance = displayIncome - displayExpenses;
  const displayIncomeCount = hasActiveFilters 
    ? incomeRecords.length 
    : currentMonthRecords.filter(r => r.type === 'income').length;
  const displayExpenseCount = hasActiveFilters
    ? expenseRecords.length
    : currentMonthRecords.filter(r => r.type === 'expense').length;
  const ticketMedio = displayIncomeCount > 0 ? displayIncome / displayIncomeCount : 0;

  // Calcular totais de contas a receber (apenas pendentes/parciais)
  const pendingOnly = pendingPayments.filter((p: any) => ['pending', 'partial', 'overdue'].includes(p.status));
  const totalPendingAmount = pendingOnly.reduce((sum: number, payment: any) => sum + (payment.amount_remaining || 0), 0);
  const overduePayments = pendingOnly.filter((payment: any) => {
    if (!payment.due_date) return false;
    const dueDate = new Date(payment.due_date);
    const today = new Date();
    return dueDate < today;
  });
  const totalOverdueAmount = overduePayments.reduce((sum: number, payment: any) => sum + (payment.amount_remaining || 0), 0);
  const completedPayments = pendingPayments.filter((p: any) => p.status === 'completed');
  const totalContractedAmount = pendingPayments.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0);
  const totalReceivedAmount = pendingPayments.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0);

  // Payment method breakdown from filteredRecords
  const paymentMethodBreakdown = filteredRecords.reduce((acc, record) => {
    const method = record.payment_method || 'unknown';
    if (!acc[method]) acc[method] = { income: 0, expense: 0, count: 0 };
    if (record.type === 'income') acc[method].income += record.amount;
    else acc[method].expense += record.amount;
    acc[method].count++;
    return acc;
  }, {} as Record<string, { income: number; expense: number; count: number }>);

  const maxPaymentTotal = Math.max(
    ...Object.values(paymentMethodBreakdown).map(v => v.income + v.expense),
    1
  );

  // Category breakdown
  const categoryBreakdown = filteredRecords.reduce((acc, record) => {
    const cat = record.category;
    if (!acc[cat]) acc[cat] = { income: 0, expense: 0, count: 0 };
    if (record.type === 'income') acc[cat].income += record.amount;
    else acc[cat].expense += record.amount;
    acc[cat].count++;
    return acc;
  }, {} as Record<string, { income: number; expense: number; count: number }>);

  // Traduzir métodos de pagamento
  const translatePaymentMethod = (method: string | undefined): string => {
    if (!method) return 'Não informado';
    
    const translations: Record<string, string> = {
      'cash': 'Dinheiro',
      'contract': 'Contrato',
      'pix': 'PIX',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'transfer': 'Transferência',
      'bank_transfer': 'Transferência',
      'check': 'Cheque',
      'boleto': 'Boleto',
      'bank_slip': 'Boleto',
      'internal': 'Interno',
      'combined': 'Combinado',
      'Manual': 'Manual',
      'manual': 'Manual',
      'Cartão': 'Cartão de Crédito',
      'cartao': 'Cartão',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'Contrato': 'Contrato',
      'Dinheiro': 'Dinheiro',
      'dinheiro': 'Dinheiro',
      'prazo': 'A Prazo',
      'dividido': 'Dividido',
      'transferencia': 'Transferência',
      'convenio': 'Convênio',
      'PIX': 'PIX',
      'Boleto': 'Boleto',
      'Transferência': 'Transferência'
    };
    
    return translations[method] || method;
  };

  const translateCategory = (category: string): string => {
    const translations: Record<string, string> = {
      // Receitas
      'consultation': 'Consulta',
      'therapy': 'Terapia',
      'evaluation': 'Avaliação',
      'foundation_revenue': 'Receita da Fundação',
      'other_income': 'Outras Receitas',
      
      // Despesas
      'supplies': 'Materiais',
      'equipment': 'Equipamentos',
      'maintenance': 'Manutenção',
      'salary': 'Salário',
      'utilities': 'Utilidades',
      'professional_payment': 'Pagamento Profissional',
      'other_expense': 'Outras Despesas'
    };
    return translations[category] || category;
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Forma de Pagamento'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.date,
        record.type === 'income' ? 'Receita' : 'Despesa',
        translateCategory(record.category),
        `"${record.description || ''}"`,
        record.amount.toFixed(2),
        translatePaymentMethod(record.payment_method)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório Exportado",
      description: "O arquivo CSV foi baixado com sucesso!",
    });
  };

  const clearFilters = () => {
    setDateFilter({ start: '', end: '' });
    setTypeFilter('all');
    setCategoryFilter('all');
    setAmountFilter({ min: '', max: '' });
    setUnitFilter('all');
    setPaymentMethodFilter('all');
    setSearchTerm('');
  };

  const filteredNotes = notes.filter(note => {
    const noteDate = new Date(note.note_date);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return noteDate.getMonth() === currentMonth && noteDate.getFullYear() === currentYear;
  });

  if (roleLoading || customPermissions.loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const hasAccess = userRole === 'director' || 
                    customPermissions.hasPermission('view_financial');

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Acesso restrito a diretores</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Cabeçalho Moderno */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-in">
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 rounded-full" />
          <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 bg-clip-text text-transparent">
            Painel Financeiro
          </h1>
          <p className="text-muted-foreground mt-2">
            Controle receitas, despesas e fluxo de caixa
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportToCSV} className="gap-2 flex-1 sm:flex-none text-sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Baixar Relatório</span>
            <span className="sm:hidden">Baixar</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={newRecord.type} onValueChange={(value) => setNewRecord({ ...newRecord, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={newRecord.category} onValueChange={(value) => setNewRecord({ ...newRecord, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {newRecord.type === 'income' ? (
                        <>
                          <SelectItem value="consultation">Consulta</SelectItem>
                          <SelectItem value="therapy">Terapia</SelectItem>
                          <SelectItem value="evaluation">Avaliação</SelectItem>
                          <SelectItem value="other_income">Outros</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="supplies">Material</SelectItem>
                          <SelectItem value="equipment">Equipamento</SelectItem>
                          <SelectItem value="maintenance">Manutenção</SelectItem>
                          <SelectItem value="salary">Salário</SelectItem>
                          <SelectItem value="utilities">Utilidades</SelectItem>
                          <SelectItem value="other_expense">Outros</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newRecord.amount}
                    onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select value={newRecord.payment_method} onValueChange={(value) => setNewRecord({ ...newRecord, payment_method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="bank_transfer">Transferência</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="contract">Contrato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    placeholder="Descrição da transação"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateRecord} disabled={!newRecord.category || !newRecord.amount}>
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Period indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-medium text-primary">Período: {periodLabel}</span>
          <span className="text-muted-foreground">— {filteredRecords.length} transações</span>
        </div>
      )}

      {/* Financial Summary Cards - Design Moderno */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-500/10 via-card to-green-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              R$ {displayIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {displayIncomeCount} receitas
            </p>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-red-500/10 via-card to-red-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
              R$ {displayExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{displayExpenseCount} despesas</p>
          </CardContent>
        </Card>
        
        <Card className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${displayBalance >= 0 ? 'bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5' : 'bg-gradient-to-br from-red-500/10 via-card to-red-500/5'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Real</CardTitle>
            <div className={`p-2 ${displayBalance >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-lg`}>
              <DollarSign className={`h-4 w-4 ${displayBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className={`text-xl sm:text-2xl font-bold ${displayBalance >= 0 ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-red-600 to-red-500'} bg-clip-text text-transparent`}>
              R$ {displayBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas</p>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-500/10 via-card to-blue-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Por receita</p>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-500/10 via-card to-orange-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <DollarSign className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              R$ {totalPendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingPayments.length} pendentes
            </p>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-500/10 via-card to-purple-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
              {hasActiveFilters ? filteredRecords.length : currentMonthRecords.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hasActiveFilters ? 'No período' : 'Este mês'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Avançados
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateStart">Data Início</Label>
              <Input
                id="dateStart"
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEnd">Data Fim</Label>
              <Input
                id="dateEnd"
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="typeFilter">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryFilter">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="consultation">Consulta</SelectItem>
                  <SelectItem value="therapy">Terapia</SelectItem>
                  <SelectItem value="evaluation">Avaliação</SelectItem>
                  <SelectItem value="foundation_revenue">Receita Fundação</SelectItem>
                  <SelectItem value="other_income">Outras Receitas</SelectItem>
                  <SelectItem value="supplies">Materiais</SelectItem>
                  <SelectItem value="equipment">Equipamentos</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="salary">Salário</SelectItem>
                  <SelectItem value="professional_payment">Pgto Profissional</SelectItem>
                  <SelectItem value="utilities">Utilidades</SelectItem>
                  <SelectItem value="other_expense">Outras Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethodFilter">Forma de Pagamento</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="combined">Combinado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitFilter">Unidade</Label>
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="madre">Madre (Clínica Social)</SelectItem>
                  <SelectItem value="floresta">Floresta (Neuroavaliação)</SelectItem>
                  <SelectItem value="atendimento_floresta">Atendimento Floresta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountMin">Valor Mín</Label>
              <Input
                id="amountMin"
                type="number"
                placeholder="0,00"
                value={amountFilter.min}
                onChange={(e) => setAmountFilter({ ...amountFilter, min: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountMax">Valor Máx</Label>
              <Input
                id="amountMax"
                type="number"
                placeholder="0,00"
                value={amountFilter.max}
                onChange={(e) => setAmountFilter({ ...amountFilter, max: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por Forma de Pagamento */}
      {filteredRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5" />
              Resumo por Forma de Pagamento
              <Badge variant="outline" className="ml-auto font-normal">
                {periodLabel}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(paymentMethodBreakdown)
                .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
                .map(([method, data]) => {
                  const total = data.income + data.expense;
                  const barWidth = (total / maxPaymentTotal) * 100;
                  return (
                    <div key={method} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{translatePaymentMethod(method)}</span>
                        <div className="flex items-center gap-3 text-xs">
                          {data.income > 0 && (
                            <span className="text-green-600">
                              +R$ {data.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {data.expense > 0 && (
                            <span className="text-red-600">
                              -R$ {data.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-xs h-5">
                            {data.count}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full flex">
                          {data.income > 0 && (
                            <div 
                              className="bg-green-500 h-full" 
                              style={{ width: `${(data.income / maxPaymentTotal) * 100}%` }} 
                            />
                          )}
                          {data.expense > 0 && (
                            <div 
                              className="bg-red-500 h-full" 
                              style={{ width: `${(data.expense / maxPaymentTotal) * 100}%` }} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {/* Resumo por Categoria */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resumo por Categoria
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(categoryBreakdown)
                  .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
                  .map(([cat, data]) => (
                    <div key={cat} className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <p className="text-xs text-muted-foreground">{translateCategory(cat)}</p>
                      {data.income > 0 && (
                        <p className="text-sm font-medium text-green-600">
                          +R$ {data.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      {data.expense > 0 && (
                        <p className="text-sm font-medium text-red-600">
                          -R$ {data.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{data.count} registros</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Saldo líquido do período */}
            <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Receitas</p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Despesas</p>
                  <p className="text-lg font-bold text-red-600">
                    R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Saldo Líquido</p>
                  <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner de contratos pendentes de revisão */}
      {records.filter(r => r.payment_method === 'contract').length > 0 && (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-700 dark:text-orange-400">
            ⚠️ {records.filter(r => r.payment_method === 'contract').length} registros precisam da forma de pagamento real
          </AlertTitle>
          <AlertDescription className="text-orange-600 dark:text-orange-300 space-y-2">
            <p>
              Esses registros foram gerados por contratos antigos e estão marcados como "Contrato" em vez da forma real 
              (Cartão de Crédito 3x, PIX, Dinheiro, etc.). Clique em <strong>Editar</strong> (ícone de lápis) em cada registro 
              para selecionar a forma de pagamento correta e o número de parcelas.
            </p>
            <Button 
              variant={showContractPending ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowContractPending(!showContractPending)}
            >
              <Filter className="h-3 w-3 mr-1" />
              {showContractPending ? 'Mostrar Todos' : `Filtrar ${records.filter(r => r.payment_method === 'contract').length} Pendentes`}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start p-1">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="pending">A Receber</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="projection">Projeção</TabsTrigger>
          <TabsTrigger value="default">Inadimplência</TabsTrigger>
          <TabsTrigger value="costcenter">Centro Custo</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Carregando transações...</p>
              ) : filteredRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {searchTerm ? 'Nenhuma transação encontrada.' : 'Nenhuma transação registrada.'}
                </p>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table className="min-w-[700px]">
                   <TableHeader>
                     <TableRow>
                       <TableHead>Data</TableHead>
                       <TableHead>Tipo</TableHead>
                       <TableHead>Categoria</TableHead>
                       <TableHead>Descrição</TableHead>
                       <TableHead>Valor</TableHead>
                       <TableHead>Pagamento</TableHead>
                       <TableHead>Ações</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.type === 'income' ? "default" : "destructive"}>
                            {record.type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                        </TableCell>
                        <TableCell>{translateCategory(record.category)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.description || '-'}
                        </TableCell>
                         <TableCell className={record.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                           {record.type === 'income' ? '+' : '-'} R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="cursor-default w-fit">
                                    {translatePaymentMethod(record.payment_method)}
                                  </Badge>
                                </TooltipTrigger>
                                {record.notes && (
                                  <TooltipContent>
                                    <p className="max-w-xs">{record.notes}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            {record.notes && (
                              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {record.notes}
                              </span>
                            )}
                          </div>
                        </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             {record.type === 'income' && (
                               <PaymentReceiptGenerator 
                                 payment={{
                                   id: record.id,
                                   amount: record.amount,
                                   date: record.date,
                                   description: record.description || '',
                                   payment_method: record.payment_method || 'cash',
                                   client_name: record.clients?.name
                                 }}
                                 variant="icon"
                               />
                             )}
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleEditRecord(record)}
                             >
                               <Edit2 className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleDeleteRecord(record.id)}
                               className="text-destructive hover:text-destructive"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{translateCategory(record.category)}</TableCell>
                      <TableCell className="uppercase">{record.clients?.name || '-'}</TableCell>
                      <TableCell>{record.description || '-'}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        + R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{translateCategory(record.category)}</TableCell>
                      <TableCell>{record.description || '-'}</TableCell>
                      <TableCell className="text-red-600 font-medium">
                        - R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {/* Resumo geral dos contratos */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-gradient-to-br from-blue-500/10 via-card to-blue-500/5 border-0">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Contratado</p>
                <p className="text-lg font-bold text-blue-600">
                  R$ {totalContractedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{pendingPayments.length} contratos</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 via-card to-green-500/5 border-0">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Recebido</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {totalReceivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{completedPayments.length} quitados</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 via-card to-orange-500/5 border-0">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">A Receber</p>
                <p className="text-lg font-bold text-orange-600">
                  R$ {totalPendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{pendingOnly.length} pendentes</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500/10 via-card to-red-500/5 border-0">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Em Atraso</p>
                <p className="text-lg font-bold text-red-600">
                  R$ {totalOverdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{overduePayments.length} vencidos</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 via-card to-purple-500/5 border-0">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">% Recebido</p>
                <p className="text-lg font-bold text-purple-600">
                  {totalContractedAmount > 0 ? ((totalReceivedAmount / totalContractedAmount) * 100).toFixed(1) : '0'}%
                </p>
                <p className="text-xs text-muted-foreground">Taxa de conversão</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista detalhada de contratos/pagamentos */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Contratos e Pagamentos Detalhados
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Select value={unitFilter} onValueChange={setUnitFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Unidades</SelectItem>
                      <SelectItem value="madre">Madre</SelectItem>
                      <SelectItem value="floresta">Floresta</SelectItem>
                      <SelectItem value="atendimento_floresta">Atend. Floresta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum contrato/pagamento encontrado.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingPayments
                    .filter((p: any) => unitFilter === 'all' || p.unit === unitFilter)
                    .map((payment: any) => {
                      const isOverdue = payment.due_date && new Date(payment.due_date) < new Date();
                      const paidInstallments = (payment.installments || []).filter((i: any) => i.status === 'paid');
                      const pendingInstallments = (payment.installments || []).filter((i: any) => i.status !== 'paid');
                      const progressPercent = payment.total_amount > 0 
                        ? ((payment.amount_paid || 0) / payment.total_amount) * 100 
                        : 0;

                      return (
                        <div 
                          key={payment.id} 
                          className={`border rounded-lg p-4 space-y-3 ${
                            payment.status === 'completed' ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' :
                            isOverdue ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20' : 
                            'border-border'
                          }`}
                        >
                          {/* Cabeçalho do contrato */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-base uppercase">
                                  {payment.client?.name || 'Paciente não identificado'}
                                </h4>
                                <Badge variant={
                                  payment.status === 'completed' ? 'default' :
                                  payment.status === 'partial' ? 'secondary' :
                                  isOverdue ? 'destructive' : 'outline'
                                }>
                                  {payment.status === 'completed' ? '✅ Quitado' :
                                   payment.status === 'partial' ? '⏳ Parcial' :
                                   isOverdue ? '🚨 Vencido' : '⏰ Pendente'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {payment.unit === 'madre' ? 'Madre' : 
                                   payment.unit === 'floresta' ? 'Floresta' : 
                                   payment.unit === 'atendimento_floresta' ? 'Atend. Floresta' : 
                                   payment.unit || 'N/A'}
                                </Badge>
                              </div>
                              {payment.client?.phone && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  📞 {payment.client.phone} {payment.client?.email ? `· ✉ ${payment.client.email}` : ''}
                                </p>
                              )}
                              {payment.description && (
                                <p className="text-sm text-muted-foreground mt-1">{payment.description}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xl font-bold text-primary">
                                R$ {(payment.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">Valor do contrato</p>
                            </div>
                          </div>

                          {/* Barra de progresso */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Pago: R$ {(payment.amount_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-muted-foreground">
                                Restante: R$ {(payment.amount_remaining || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  progressPercent >= 100 ? 'bg-green-500' : 
                                  progressPercent > 50 ? 'bg-blue-500' : 
                                  progressPercent > 0 ? 'bg-orange-500' : 'bg-muted-foreground/20'
                                }`}
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">{progressPercent.toFixed(0)}% pago</p>
                          </div>

                          {/* Detalhes do pagamento */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm bg-muted/30 rounded-lg p-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
                              <p className="font-medium">{translatePaymentMethod(payment.payment_method)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Tipo</p>
                              <p className="font-medium">
                                {payment.payment_type === 'avista' ? 'À Vista' : 
                                 payment.payment_type === 'parcelado' ? 'Parcelado' : 
                                 payment.payment_type || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Parcelas</p>
                              <p className="font-medium">
                                {payment.installments_total 
                                  ? `${payment.installments_paid || 0}/${payment.installments_total} pagas`
                                  : 'Pagamento único'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Vencimento</p>
                              <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                {payment.due_date 
                                  ? new Date(payment.due_date).toLocaleDateString('pt-BR')
                                  : 'Não definido'}
                              </p>
                            </div>
                          </div>

                          {/* Entrada + Cartão */}
                          {(payment.down_payment_amount > 0 || (payment.credit_card_installments && payment.credit_card_installments > 1)) && (
                            <div className="flex flex-wrap gap-3 text-sm">
                              {payment.down_payment_amount > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                  <span className="text-green-700 dark:text-green-400 text-xs font-medium">
                                    💰 Entrada: R$ {payment.down_payment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    {payment.down_payment_method && ` (${translatePaymentMethod(payment.down_payment_method)})`}
                                  </span>
                                </div>
                              )}
                              {payment.credit_card_installments && payment.credit_card_installments > 1 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <span className="text-blue-700 dark:text-blue-400 text-xs font-medium">
                                    💳 {payment.credit_card_installments}x no Cartão de Crédito
                                    {payment.total_amount && payment.credit_card_installments > 0 && (
                                      <> · R$ {((payment.total_amount - (payment.down_payment_amount || 0)) / payment.credit_card_installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cada</>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pagamento combinado */}
                          {payment.payment_combination && Array.isArray(payment.payment_combination) && payment.payment_combination.length > 0 && (
                            <div className="text-sm">
                              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Pagamento Combinado:</p>
                              <div className="flex flex-wrap gap-2">
                                {payment.payment_combination.map((combo: any, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs py-1">
                                    {translatePaymentMethod(combo.method || combo.payment_method)}: 
                                    R$ {(combo.amount || combo.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    {combo.installments && combo.installments > 1 && ` (${combo.installments}x)`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Lista de parcelas detalhada */}
                          {payment.installments && payment.installments.length > 0 && (
                            <div className="text-sm">
                              <p className="text-xs text-muted-foreground mb-2 font-medium">
                                Parcelas ({paidInstallments.length} pagas / {pendingInstallments.length} pendentes):
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {payment.installments.map((inst: any) => {
                                  const instOverdue = inst.due_date && new Date(inst.due_date) < new Date() && inst.status !== 'paid';
                                  return (
                                    <div 
                                      key={inst.id} 
                                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                                        inst.status === 'paid' 
                                          ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                                          : instOverdue
                                            ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                                            : 'bg-muted/50 border border-border'
                                      }`}
                                    >
                                      <div>
                                        <span className="font-medium">
                                          {inst.status === 'paid' ? '✅' : instOverdue ? '🚨' : '⏳'} {inst.installment_number}ª parcela
                                        </span>
                                        <p className="text-muted-foreground">
                                          Venc: {inst.due_date ? new Date(inst.due_date).toLocaleDateString('pt-BR') : '-'}
                                        </p>
                                        {inst.paid_at && (
                                          <p className="text-green-600 text-[10px]">
                                            Pago em {new Date(inst.paid_at).toLocaleDateString('pt-BR')}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold">
                                          R$ {(inst.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        {inst.paid_amount > 0 && inst.paid_amount < inst.amount && (
                                          <p className="text-orange-600">
                                            Pago: R$ {inst.paid_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Notas */}
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground italic border-t pt-2">
                              📝 {payment.notes}
                            </p>
                          )}

                          {/* Data de criação */}
                          <p className="text-[10px] text-muted-foreground">
                            Criado em {new Date(payment.created_at).toLocaleDateString('pt-BR')} às {new Date(payment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  Notas Diárias
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Notas
                  </Button>
                  <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Nota do Dia
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Nota Diária</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="noteDate">Data</Label>
                          <Input
                            id="noteDate"
                            type="date"
                            value={newNote.note_date}
                            onChange={(e) => setNewNote({ ...newNote, note_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="noteText">Nota</Label>
                          <Textarea
                            id="noteText"
                            rows={4}
                            value={newNote.note_text}
                            onChange={(e) => setNewNote({ ...newNote, note_text: e.target.value })}
                            placeholder="Digite sua nota sobre o dia..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateNote} disabled={!newNote.note_text.trim()}>
                          Salvar Nota
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredNotes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma nota para o período selecionado.
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredNotes.map((note) => (
                    <div key={note.id} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">
                          {new Date(note.note_date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Usuário
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório Mensal
                </Button>
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Notas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projection">
          <FinancialProjection />
        </TabsContent>

        <TabsContent value="default">
          <DefaultManagementPanel />
        </TabsContent>

        <TabsContent value="costcenter">
          <CostCenterAnalysis />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Relatório Detalhado - Mês atual</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum detalhe financeiro de pacientes para o período selecionado.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {incomeRecords.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Receitas</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {expenseRecords.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Despesas</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    R$ {(totalIncome / (incomeRecords.length || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditFinancialRecordDialog
        record={editingRecord}
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingRecord(null);
        }}
        onSave={loadFinancialRecords}
      />
    </div>
  );
}