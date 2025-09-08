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
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface FinancialRecord {
  id: string;
  type: string;
  category: string;
  amount: number;
  description?: string;
  transaction_date: string;
  payment_method?: string;
  status: string;
  client_id?: string;
  created_at: string;
  clients?: { name: string };
}

export default function Financial() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newRecord, setNewRecord] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    client_id: ''
  });

  useEffect(() => {
    loadFinancialRecords();
  }, []);

  const loadFinancialRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          clients (name)
        `)
        .order('transaction_date', { ascending: false });

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

  const handleCreateRecord = async () => {
    try {
      const { error } = await supabase
        .from('financial_records')
        .insert([{
          ...newRecord,
          amount: parseFloat(newRecord.amount),
          status: 'confirmed',
          client_id: newRecord.client_id || null
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro financeiro criado com sucesso!",
      });
      
      setIsDialogOpen(false);
      setNewRecord({
        type: 'income',
        category: '',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
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

  const filteredRecords = records.filter(record =>
    record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const incomeRecords = filteredRecords.filter(r => r.type === 'income');
  const expenseRecords = filteredRecords.filter(r => r.type === 'expense');

  const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Current month calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthRecords = filteredRecords.filter(r => {
    const recordDate = new Date(r.transaction_date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  const currentMonthIncome = currentMonthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const currentMonthExpenses = currentMonthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financeiro</h1>
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
                <Label htmlFor="transaction_date">Data</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={newRecord.transaction_date}
                  onChange={(e) => setNewRecord({ ...newRecord, transaction_date: e.target.value })}
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

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {currentMonthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRecords.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
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
                          {new Date(record.transaction_date).toLocaleDateString('pt-BR')}
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
                        {new Date(record.transaction_date).toLocaleDateString('pt-BR')}
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
                        {new Date(record.transaction_date).toLocaleDateString('pt-BR')}
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
      </Tabs>
    </div>
  );
}