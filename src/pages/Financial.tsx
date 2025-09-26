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
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Calendar, Download, Filter, FileText, StickyNote, Shield } from 'lucide-react';
import { useRolePermissions } from '@/hooks/useRolePermissions';

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
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const { toast } = useToast();
  const { user } = useAuth();
  const { userRole, loading: roleLoading } = useRolePermissions();

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
    if (roleLoading) return;
    
    // Apenas diretores podem acessar financeiro
    if (userRole !== 'director') {
      toast({
        variant: "destructive",
        title: "Acesso Restrito",
        description: "Apenas diretores têm acesso ao sistema financeiro."
      });
      return;
    }
    
    loadFinancialRecords();
    loadFinancialNotes();
  }, [roleLoading, userRole]);

  const loadFinancialRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          clients (name)
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
    
    return matchesSearch && matchesDateRange && matchesType && matchesCategory && matchesAmount;
  });

  const incomeRecords = filteredRecords.filter(r => r.type === 'income');
  const expenseRecords = filteredRecords.filter(r => r.type === 'expense');

  const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Current month calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthRecords = filteredRecords.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  const currentMonthIncome = currentMonthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const currentMonthExpenses = currentMonthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);

  const exportToCSV = () => {
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Forma de Pagamento'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.date,
        record.type === 'income' ? 'Receita' : 'Despesa',
        record.category,
        `"${record.description || ''}"`,
        record.amount.toFixed(2),
        record.payment_method || ''
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
    setSearchTerm('');
  };

  const filteredNotes = notes.filter(note => {
    const noteDate = new Date(note.note_date);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return noteDate.getMonth() === currentMonth && noteDate.getFullYear() === currentYear;
  });

  if (roleLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (userRole !== 'director') {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel Financeiro</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Relatório
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

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {currentMonthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Atendimentos: {currentMonthRecords.filter(r => r.type === 'income').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas com Compras</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Materiais adquiridos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo de Materiais Usados</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {(currentMonthExpenses * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Materiais utilizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Receitas - Despesas Totais</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{currentMonthRecords.filter(r => r.type === 'income').length}</div>
            <p className="text-xs text-muted-foreground">Total cadastrados</p>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="notes">Notas Diárias</TabsTrigger>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
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
                        <TableCell>{record.category}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.description || '-'}
                        </TableCell>
                        <TableCell className={record.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {record.type === 'income' ? '+' : '-'} R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.payment_method}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Cliente</TableHead>
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
                      <TableCell>{record.category}</TableCell>
                      <TableCell>{record.clients?.name || '-'}</TableCell>
                      <TableCell>{record.description || '-'}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        + R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
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
                      <TableCell>{record.category}</TableCell>
                      <TableCell>{record.description || '-'}</TableCell>
                      <TableCell className="text-red-600 font-medium">
                        - R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Relatório Detalhado - Mês atual</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum detalhe financeiro de clientes para o período selecionado.
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
    </div>
  );
}