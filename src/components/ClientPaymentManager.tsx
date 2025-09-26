import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Plus, 
  Calendar as CalendarIcon,
  Edit,
  Check,
  X,
  AlertTriangle,
  DollarSign,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ClientPayment {
  id: string;
  total_amount: number;
  payment_type: 'avista' | 'aprazo';
  installments_total: number;
  installments_paid: number;
  amount_paid: number;
  amount_remaining: number;
  description?: string;
  due_date?: string;
  payment_method?: string;
  status: 'pending' | 'partial' | 'completed' | 'overdue';
  created_at: string;
}

interface PaymentInstallment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date?: string;
  paid_amount: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  payment_method?: string;
  notes?: string;
}

interface ClientPaymentManagerProps {
  clientId: string;
  clientName: string;
  userProfile: any;
}

export default function ClientPaymentManager({ clientId, clientName, userProfile }: ClientPaymentManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<ClientPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [installmentsDialogOpen, setInstallmentsDialogOpen] = useState(false);
  const [payInstallmentDialogOpen, setPayInstallmentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);

  const [newPayment, setNewPayment] = useState({
    total_amount: '',
    payment_type: 'avista' as 'avista' | 'aprazo',
    installments_total: 1,
    description: '',
    due_date: new Date(),
    payment_method: ''
  });

  const [paymentData, setPaymentData] = useState({
    paid_amount: '',
    payment_method: '',
    notes: ''
  });

  // Verificar se é coordenador madre ou diretor
  const canManagePayments = () => {
    return userProfile?.employee_role === 'director' || 
           userProfile?.employee_role === 'coordinator_madre';
  };

  useEffect(() => {
    if (canManagePayments()) {
      loadPayments();
    }
  }, [clientId, userProfile]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_payments')
        .select('*')
        .eq('client_id', clientId)
        .eq('unit', 'madre')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data || []) as ClientPayment[]);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os pagamentos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInstallments = async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_installments')
        .select('*')
        .eq('client_payment_id', paymentId)
        .order('installment_number');

      if (error) throw error;
      setInstallments((data || []) as PaymentInstallment[]);
    } catch (error) {
      console.error('Error loading installments:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as parcelas.",
      });
    }
  };

  const handleCreatePayment = async () => {
    if (!newPayment.total_amount || !newPayment.payment_method) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    const totalAmount = parseFloat(newPayment.total_amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Valor inválido.",
      });
      return;
    }

    if (newPayment.payment_type === 'aprazo' && newPayment.installments_total < 2) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Pagamento a prazo deve ter pelo menos 2 parcelas.",
      });
      return;
    }

    setLoading(true);
    try {
      // Criar o pagamento principal
      const { data: paymentData, error: paymentError } = await supabase
        .from('client_payments')
        .insert({
          client_id: clientId,
          total_amount: totalAmount,
          payment_type: newPayment.payment_type,
          installments_total: newPayment.payment_type === 'avista' ? 1 : newPayment.installments_total,
          amount_remaining: totalAmount,
          description: newPayment.description,
          due_date: format(newPayment.due_date, 'yyyy-MM-dd'),
          payment_method: newPayment.payment_method,
          created_by: user?.id,
          unit: 'madre'
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Criar parcelas se for a prazo
      if (newPayment.payment_type === 'aprazo') {
        const { error: installmentsError } = await supabase
          .rpc('create_payment_installments', {
            p_client_payment_id: paymentData.id,
            p_installments_total: newPayment.installments_total,
            p_total_amount: totalAmount,
            p_first_due_date: format(newPayment.due_date, 'yyyy-MM-dd')
          });

        if (installmentsError) throw installmentsError;
      } else {
        // Para pagamento à vista, criar uma única "parcela"
        const { error: installmentError } = await supabase
          .from('payment_installments')
          .insert({
            client_payment_id: paymentData.id,
            installment_number: 1,
            amount: totalAmount,
            due_date: format(newPayment.due_date, 'yyyy-MM-dd')
          });

        if (installmentError) throw installmentError;
      }

      toast({
        title: "Sucesso",
        description: `Pagamento ${newPayment.payment_type === 'avista' ? 'à vista' : 'a prazo'} criado com sucesso!`,
      });

      setAddPaymentDialogOpen(false);
      setNewPayment({
        total_amount: '',
        payment_type: 'avista',
        installments_total: 1,
        description: '',
        due_date: new Date(),
        payment_method: ''
      });
      loadPayments();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o pagamento.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = async () => {
    if (!selectedInstallment || !paymentData.paid_amount) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha o valor pago.",
      });
      return;
    }

    const paidAmount = parseFloat(paymentData.paid_amount);
    if (isNaN(paidAmount) || paidAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Valor inválido.",
      });
      return;
    }

    const maxAmount = selectedInstallment.amount - selectedInstallment.paid_amount;
    if (paidAmount > maxAmount) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Valor pago não pode ser maior que o valor restante da parcela (R$ ${maxAmount.toFixed(2)}).`,
      });
      return;
    }

    setLoading(true);
    try {
      const newPaidAmount = selectedInstallment.paid_amount + paidAmount;
      const newStatus = newPaidAmount >= selectedInstallment.amount ? 'paid' : 'partial';

      const { error } = await supabase
        .from('payment_installments')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          paid_date: newStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : selectedInstallment.paid_date,
          payment_method: paymentData.payment_method,
          notes: paymentData.notes,
          paid_by: user?.id
        })
        .eq('id', selectedInstallment.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Pagamento de R$ ${paidAmount.toFixed(2)} registrado com sucesso!`,
      });

      setPayInstallmentDialogOpen(false);
      setPaymentData({
        paid_amount: '',
        payment_method: '',
        notes: ''
      });
      
      if (selectedPayment) {
        loadInstallments(selectedPayment.id);
      }
      loadPayments();
    } catch (error) {
      console.error('Error paying installment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { text: 'Pendente', variant: 'secondary' as const },
      'partial': { text: 'Parcial', variant: 'default' as const },
      'completed': { text: 'Completo', variant: 'outline' as const },
      'overdue': { text: 'Vencido', variant: 'destructive' as const }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  if (!canManagePayments()) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Controle de Pagamentos
          </CardTitle>
          <Button onClick={() => setAddPaymentDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pagamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Carregando pagamentos...</p>
        ) : payments.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum pagamento cadastrado.</p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Badge {...getStatusBadge(payment.status)}>
                        {getStatusBadge(payment.status).text}
                      </Badge>
                      <Badge variant={payment.payment_type === 'avista' ? 'default' : 'secondary'}>
                        {payment.payment_type === 'avista' ? 'À Vista' : 'A Prazo'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(payment.total_amount)}</p>
                      {payment.payment_type === 'aprazo' && (
                        <p className="text-sm text-muted-foreground">
                          {payment.installments_paid}/{payment.installments_total} parcelas pagas
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Valor Pago</Label>
                      <p className="font-medium text-green-600">{formatCurrency(payment.amount_paid)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Saldo Devedor</Label>
                      <p className="font-medium text-red-600">{formatCurrency(payment.amount_remaining)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Vencimento</Label>
                      <p className="font-medium">{payment.due_date ? formatDate(payment.due_date) : 'N/A'}</p>
                    </div>
                  </div>

                  {payment.description && (
                    <div className="mb-4">
                      <Label className="text-xs text-muted-foreground">Descrição</Label>
                      <p className="text-sm">{payment.description}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(payment);
                        loadInstallments(payment.id);
                        setInstallmentsDialogOpen(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {payment.payment_type === 'avista' ? 'Ver Detalhes' : 'Gerenciar Parcelas'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog para Novo Pagamento */}
        <Dialog open={addPaymentDialogOpen} onOpenChange={setAddPaymentDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Pagamento - {clientName}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Total *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newPayment.total_amount}
                    onChange={(e) => setNewPayment({ ...newPayment, total_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tipo de Pagamento *</Label>
                  <Select 
                    value={newPayment.payment_type} 
                    onValueChange={(value: 'avista' | 'aprazo') => 
                      setNewPayment({ ...newPayment, payment_type: value, installments_total: value === 'avista' ? 1 : 2 })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avista">À Vista</SelectItem>
                      <SelectItem value="aprazo">A Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newPayment.payment_type === 'aprazo' && (
                <div>
                  <Label>Número de Parcelas</Label>
                  <Input
                    type="number"
                    min="2"
                    max="60"
                    value={newPayment.installments_total}
                    onChange={(e) => setNewPayment({ ...newPayment, installments_total: parseInt(e.target.value) || 2 })}
                  />
                </div>
              )}

              <div>
                <Label>Forma de Pagamento *</Label>
                <Select 
                  value={newPayment.payment_method} 
                  onValueChange={(value) => setNewPayment({ ...newPayment, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data de Vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newPayment.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newPayment.due_date ? format(newPayment.due_date, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newPayment.due_date}
                      onSelect={(date) => date && setNewPayment({ ...newPayment, due_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descrição do pagamento..."
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreatePayment} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Pagamento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Gerenciar Parcelas */}
        <Dialog open={installmentsDialogOpen} onOpenChange={setInstallmentsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedPayment?.payment_type === 'avista' ? 'Detalhes do Pagamento' : 'Gerenciar Parcelas'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedPayment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-semibold">Total: {formatCurrency(selectedPayment.total_amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPayment.payment_type === 'avista' ? 'Pagamento à Vista' : `${selectedPayment.installments_total} parcelas`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-medium">Pago: {formatCurrency(selectedPayment.amount_paid)}</p>
                    <p className="text-red-600 font-medium">Saldo: {formatCurrency(selectedPayment.amount_remaining)}</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor Pago</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell>
                          {selectedPayment.payment_type === 'avista' ? 'À Vista' : `${installment.installment_number}/${selectedPayment.installments_total}`}
                        </TableCell>
                        <TableCell>{formatCurrency(installment.amount)}</TableCell>
                        <TableCell>{formatDate(installment.due_date)}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(installment.paid_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge {...getStatusBadge(installment.status)}>
                            {getStatusBadge(installment.status).text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {installment.status !== 'paid' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedInstallment(installment);
                                setPaymentData({
                                  paid_amount: (installment.amount - installment.paid_amount).toFixed(2),
                                  payment_method: '',
                                  notes: ''
                                });
                                setPayInstallmentDialogOpen(true);
                              }}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Pagar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para Pagar Parcela */}
        <Dialog open={payInstallmentDialogOpen} onOpenChange={setPayInstallmentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            
            {selectedInstallment && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold">
                    Parcela {selectedInstallment.installment_number} - {formatCurrency(selectedInstallment.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Valor restante: {formatCurrency(selectedInstallment.amount - selectedInstallment.paid_amount)}
                  </p>
                </div>

                <div>
                  <Label>Valor Pago *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={paymentData.paid_amount}
                    onChange={(e) => setPaymentData({ ...paymentData, paid_amount: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select 
                    value={paymentData.payment_method} 
                    onValueChange={(value) => setPaymentData({ ...paymentData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Observações sobre o pagamento..."
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayInstallmentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePayInstallment} disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar Pagamento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}