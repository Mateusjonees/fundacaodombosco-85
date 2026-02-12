import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit2, AlertTriangle } from 'lucide-react';

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

interface EditFinancialRecordDialogProps {
  record: FinancialRecord | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

// Mapa de nomes legíveis para formas de pagamento
const paymentMethodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  bank_transfer: 'Transferência',
  bank_slip: 'Boleto',
  check: 'Cheque',
  contract: 'Contrato',
  combined: 'Combinado',
  prazo: 'A Prazo',
  convenio: 'Convênio',
  internal: 'Interno',
};

// Gera texto automático de notas baseado na forma de pagamento
const generatePaymentNotes = (method: string, installments: number, amount: number): string => {
  const label = paymentMethodLabels[method] || method;
  const total = parseFloat(amount.toString());

  if ((method === 'credit_card' || method === 'debit_card') && installments > 1) {
    const perInstallment = (total / installments).toFixed(2).replace('.', ',');
    return `${label} - ${installments}x de R$ ${perInstallment}`;
  }

  if (['pix', 'cash', 'bank_transfer', 'bank_slip', 'check'].includes(method)) {
    return `${label} - Pagamento à vista`;
  }

  return label;
};

export function EditFinancialRecordDialog({ record, open, onClose, onSave }: EditFinancialRecordDialogProps) {
  const [formData, setFormData] = useState({
    type: '',
    category: '',
    amount: '',
    description: '',
    date: '',
    payment_method: '',
    notes: ''
  });
  const [installments, setInstallments] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isLegacyContract = record?.payment_method === 'contract';
  const showInstallments = formData.payment_method === 'credit_card' || formData.payment_method === 'debit_card';

  // Atualizar formData quando o record mudar
  useEffect(() => {
    if (record) {
      setFormData({
        type: record.type,
        category: record.category,
        amount: record.amount.toString(),
        description: record.description || '',
        date: record.date,
        payment_method: isLegacyContract ? '' : (record.payment_method || ''),
        notes: record.notes || ''
      });
      setInstallments(1);
    }
  }, [record]);

  // Auto-gerar notas quando forma de pagamento ou parcelas mudam
  useEffect(() => {
    if (formData.payment_method && formData.amount && isLegacyContract) {
      const autoNotes = generatePaymentNotes(formData.payment_method, installments, parseFloat(formData.amount));
      setFormData(prev => ({ ...prev, notes: autoNotes }));
    }
  }, [formData.payment_method, installments]);

  const handleSave = async () => {
    if (!record) return;

    if (isLegacyContract && !formData.payment_method) {
      toast({
        variant: "destructive",
        title: "Forma de pagamento obrigatória",
        description: "Selecione a forma de pagamento real para este registro."
      });
      return;
    }

    setLoading(true);
    try {
      // Se notas estiverem vazias, gerar automaticamente
      let finalNotes = formData.notes;
      if (!finalNotes && formData.payment_method) {
        finalNotes = generatePaymentNotes(formData.payment_method, installments, parseFloat(formData.amount));
      }

      const { error } = await supabase
        .from('financial_records')
        .update({
          type: formData.type,
          category: formData.category,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          payment_method: formData.payment_method,
          notes: finalNotes || null
        })
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro financeiro atualizado com sucesso!"
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating financial record:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o registro financeiro."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: '',
      category: '',
      amount: '',
      description: '',
      date: '',
      payment_method: '',
      notes: ''
    });
    setInstallments(1);
    onClose();
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Editar Registro Financeiro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Banner de alerta para registros de contrato antigos */}
          {isLegacyContract && (
            <Alert className="border-orange-500/50 bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-600 dark:text-orange-300 text-sm">
                <strong>⚠️ Revisão necessária:</strong> Este registro foi salvo como "Contrato" sem a forma de pagamento real.
                Selecione abaixo como o paciente pagou (Cartão, PIX, Dinheiro, etc.) e o número de parcelas se aplicável.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {formData.type === 'income' ? (
                  <>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="therapy">Terapia</SelectItem>
                    <SelectItem value="evaluation">Avaliação</SelectItem>
                    <SelectItem value="foundation_revenue">Receita da Fundação</SelectItem>
                    <SelectItem value="other_income">Outras Receitas</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="supplies">Materiais</SelectItem>
                    <SelectItem value="equipment">Equipamentos</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="professional_payment">Pagamento Profissional</SelectItem>
                    <SelectItem value="utilities">Utilidades</SelectItem>
                    <SelectItem value="salary">Salário</SelectItem>
                    <SelectItem value="other_expense">Outras Despesas</SelectItem>
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
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">
              Forma de Pagamento {isLegacyContract && <span className="text-orange-600 font-bold">*</span>}
            </Label>
            <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
              <SelectTrigger className={isLegacyContract && !formData.payment_method ? 'border-orange-500 ring-1 ring-orange-500' : ''}>
                <SelectValue placeholder={isLegacyContract ? '⚠️ Selecione a forma real de pagamento' : 'Selecione a forma de pagamento'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="bank_transfer">Transferência</SelectItem>
                <SelectItem value="bank_slip">Boleto</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="combined">Combinado</SelectItem>
                <SelectItem value="prazo">A Prazo</SelectItem>
                <SelectItem value="convenio">Convênio</SelectItem>
                <SelectItem value="internal">Interno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campo de parcelas - visível quando cartão */}
          {showInstallments && (
            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                max="48"
                value={installments}
                onChange={(e) => setInstallments(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="1"
              />
              {installments > 1 && formData.amount && (
                <p className="text-xs text-muted-foreground">
                  {installments}x de R$ {(parseFloat(formData.amount) / installments).toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Digite uma descrição para a transação..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Detalhes do Pagamento</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Cartão de Crédito - 3x de R$ 533,33 | Entrada: R$ 200,00 em Dinheiro"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              {isLegacyContract
                ? 'Gerado automaticamente com base na forma de pagamento. Edite se necessário.'
                : 'Informe detalhes como parcelas, forma de entrada, valores combinados, etc.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
