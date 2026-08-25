import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatNowBR } from '@/lib/utils';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';

// Relatório financeiro consolidado por mês (receitas, despesas, saldo e variação)

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const brl = (v: number) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface MonthRow {
  month: number;
  income: number;
  expense: number;
  balance: number;
  count: number;
  categories: Record<string, number>;
}

const emptyRows = (): MonthRow[] =>
  MONTHS.map((_, i) => ({ month: i, income: 0, expense: 0, balance: 0, count: 0, categories: {} }));

export const MonthlyFinancialReport = ({ unitFilter = 'all' }: { unitFilter?: string }) => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MonthRow[]>(emptyRows());

  const years = useMemo(
    () => Array.from({ length: 6 }, (_, i) => String(currentYear - i)),
    [currentYear]
  );

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, unitFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;

      const [manual, automatic, payments] = await Promise.all([
        supabase
          .from('financial_records')
          .select('amount, type, category, date')
          .gte('date', start)
          .lte('date', end),
        supabase
          .from('automatic_financial_records')
          .select('amount, transaction_type, payment_date, origin_type')
          .gte('payment_date', `${start}T00:00:00`)
          .lte('payment_date', `${end}T23:59:59`),
        supabase
          .from('client_payments')
          .select('amount_paid, created_at, unit')
          .gte('created_at', `${start}T00:00:00`)
          .lte('created_at', `${end}T23:59:59`),
      ]);

      const next = emptyRows();

      const add = (m: number, type: 'income' | 'expense', amount: number, category: string) => {
        if (m < 0 || m > 11 || !amount) return;
        const row = next[m];
        if (type === 'income') row.income += amount;
        else row.expense += amount;
        row.count += 1;
        row.categories[category] = (row.categories[category] || 0) + amount;
      };

      (manual.data || []).forEach((r: any) => {
        const m = Number(String(r.date).slice(5, 7)) - 1;
        add(m, r.type === 'expense' ? 'expense' : 'income', Number(r.amount) || 0, r.category || 'outros');
      });

      (automatic.data || []).forEach((r: any) => {
        const m = new Date(r.payment_date).getMonth();
        add(
          m,
          r.transaction_type === 'expense' ? 'expense' : 'income',
          Number(r.amount) || 0,
          r.origin_type || 'atendimento'
        );
      });

      (payments.data || []).forEach((p: any) => {
        if (unitFilter !== 'all' && p.unit !== unitFilter) return;
        const m = new Date(p.created_at).getMonth();
        add(m, 'income', Number(p.amount_paid) || 0, 'pagamento_paciente');
      });

      next.forEach((r) => { r.balance = r.income - r.expense; });
      setRows(next);
    } catch (err: any) {
      console.error('[MonthlyFinancialReport]', err);
      toast({ variant: 'destructive', title: 'Erro ao carregar relatório', description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const income = rows.reduce((s, r) => s + r.income, 0);
    const expense = rows.reduce((s, r) => s + r.expense, 0);
    const active = rows.filter((r) => r.income || r.expense);
    return {
      income,
      expense,
      balance: income - expense,
      avg: active.length ? income / active.length : 0,
      best: rows.reduce((b, r) => (r.income > b.income ? r : b), rows[0]),
    };
  }, [rows]);

  const variation = (i: number) => {
    if (i === 0) return null;
    const prev = rows[i - 1].income;
    if (!prev) return null;
    return Math.round(((rows[i].income - prev) / prev) * 100);
  };

  const exportCSV = () => {
    const lines = [
      ['Mês', 'Receitas', 'Despesas', 'Saldo', 'Lançamentos'].join(';'),
      ...rows.map((r) =>
        [MONTHS[r.month], r.income.toFixed(2), r.expense.toFixed(2), r.balance.toFixed(2), r.count].join(';')
      ),
      ['TOTAL', totals.income.toFixed(2), totals.expense.toFixed(2), totals.balance.toFixed(2), ''].join(';'),
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const M = 15;
    let y = 20;

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Financeiro Mensal', M, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fundação Dom Bosco  •  Ano ${year}`, M, y);
    y += 5;
    doc.text(`Gerado em ${formatNowBR()}`, M, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const cols = [M, M + 45, M + 90, M + 135, M + 172];
    doc.text('Mês', cols[0], y);
    doc.text('Receitas', cols[1], y);
    doc.text('Despesas', cols[2], y);
    doc.text('Saldo', cols[3], y);
    doc.text('Lanç.', cols[4], y);
    y += 2;
    doc.line(M, y, 195, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    rows.forEach((r) => {
      doc.text(MONTHS[r.month], cols[0], y);
      doc.text(brl(r.income), cols[1], y);
      doc.text(brl(r.expense), cols[2], y);
      doc.text(brl(r.balance), cols[3], y);
      doc.text(String(r.count), cols[4], y);
      y += 6;
    });

    doc.line(M, y - 4, 195, y - 4);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', cols[0], y + 1);
    doc.text(brl(totals.income), cols[1], y + 1);
    doc.text(brl(totals.expense), cols[2], y + 1);
    doc.text(brl(totals.balance), cols[3], y + 1);

    doc.save(`relatorio-financeiro-${year}.pdf`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Relatório por mês
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={loading}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button size="sm" onClick={exportPDF} disabled={loading}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Receitas no ano</p>
              <p className="text-lg font-semibold text-emerald-600">{brl(totals.income)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Despesas no ano</p>
              <p className="text-lg font-semibold text-red-600">{brl(totals.expense)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Saldo</p>
              <p className={`text-lg font-semibold ${totals.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{brl(totals.balance)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Média mensal (receita)</p>
              <p className="text-lg font-semibold">{brl(totals.avg)}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Receitas</TableHead>
                    <TableHead className="text-right">Despesas</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead className="text-right">Lançamentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => {
                    const v = variation(i);
                    return (
                      <TableRow key={r.month} className={r.income || r.expense ? '' : 'opacity-50'}>
                        <TableCell className="font-medium">{MONTHS[r.month]}</TableCell>
                        <TableCell className="text-right text-emerald-600">{brl(r.income)}</TableCell>
                        <TableCell className="text-right text-red-600">{brl(r.expense)}</TableCell>
                        <TableCell className={`text-right font-medium ${r.balance >= 0 ? '' : 'text-red-600'}`}>{brl(r.balance)}</TableCell>
                        <TableCell className="text-right">
                          {v === null ? (
                            <span className="text-muted-foreground text-xs">—</span>
                          ) : (
                            <Badge variant="outline" className={v >= 0 ? 'text-emerald-600 border-emerald-300' : 'text-red-600 border-red-300'}>
                              {v >= 0 ? '+' : ''}{v}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{r.count}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right text-emerald-600">{brl(totals.income)}</TableCell>
                    <TableCell className="text-right text-red-600">{brl(totals.expense)}</TableCell>
                    <TableCell className={`text-right ${totals.balance >= 0 ? '' : 'text-red-600'}`}>{brl(totals.balance)}</TableCell>
                    <TableCell />
                    <TableCell className="text-right">{rows.reduce((s, r) => s + r.count, 0)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyFinancialReport;
