import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { formatDateBR, getTodayLocalISODate } from '@/lib/utils';
import {
  Package2, Plus, AlertTriangle, ArrowDownToLine, ArrowUpFromLine,
  Search, FileDown, Pencil, Boxes, CalendarDays, Trash2, Undo2, Clock,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Categorias de estoque físico
const CATEGORIES = [
  { value: 'material_escritorio', label: 'Papelaria / Escritório' },
  { value: 'material_consumo', label: 'Material de Consumo' },
  { value: 'material_cozinha', label: 'Material de Cozinha / Alimentos' },
  { value: 'material_profissional', label: 'Material Profissional' },
  { value: 'material_limpeza', label: 'Material de Limpeza' },
  { value: 'material_terapeutico', label: 'Material Terapêutico' },
  { value: 'testes_neuro', label: 'Testes Neuropsicológicos' },
  { value: 'equipamento', label: 'Equipamentos' },
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'copa_cozinha', label: 'Copa e Cozinha' },
  { value: 'higiene', label: 'Higiene' },
  { value: 'outros', label: 'Outros' },
];

// Unidades da clínica (estoque separado por unidade)
const CLINIC_UNITS = [
  { value: 'todas', label: 'Todas as unidades' },
  { value: 'madre', label: 'MADRE' },
  { value: 'floresta', label: 'Floresta' },
  { value: 'atendimento_floresta', label: 'Atendimento Floresta' },
];

const clinicUnitLabel = (value?: string | null) =>
  CLINIC_UNITS.find((u) => u.value === (value || 'todas'))?.label || 'Todas as unidades';

const UNITS = ['unidade', 'caixa', 'pacote', 'kit', 'litro', 'kg', 'resma', 'par'];

const categoryLabel = (value?: string) =>
  CATEGORIES.find((c) => c.value === value)?.label || value || 'Outros';

interface StockItem {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  clinic_unit?: string | null;
  unit?: string | null;
  current_quantity: number;
  minimum_quantity: number;
  unit_cost: number;
  supplier?: string | null;
  location?: string | null;
  is_active?: boolean | null;
}

interface Movement {
  id: string;
  stock_item_id: string;
  type: string;
  quantity: number;
  unit_cost?: number | null;
  total_cost?: number | null;
  reason?: string | null;
  notes?: string | null;
  date: string;
  withdrawn_by_user_id?: string | null;
  withdrawn_by_name?: string | null;
  withdrawal_date?: string | null;
  destination?: string | null;
  expected_return_date?: string | null;
  returned_at?: string | null;
  clinic_unit?: string | null;
  created_by?: string | null;
  created_at: string;
}

const emptyItem = {
  name: '',
  description: '',
  category: 'material_escritorio',
  clinic_unit: 'todas',
  unit: 'unidade',
  current_quantity: 0,
  minimum_quantity: 0,
  unit_cost: 0,
  supplier: '',
  location: '',
};

export default function StockControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canManageStock, userRole, loading: roleLoading } = useRolePermissions();

  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [profiles, setProfiles] = useState<Array<{ user_id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');

  // Dialogs
  const [itemDialog, setItemDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ ...emptyItem });

  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [entryDialog, setEntryDialog] = useState(false);
  const [targetItem, setTargetItem] = useState<StockItem | null>(null);

  const [withdrawForm, setWithdrawForm] = useState({
    quantity: 1,
    withdrawn_by_user_id: '',
    withdrawn_by_name: '',
    withdrawal_date: getTodayLocalISODate(),
    destination: '',
    expected_return_date: '',
    reason: '',
    generate_term: true,
  });

  // Devolução
  const [returnDialog, setReturnDialog] = useState(false);
  const [returnTarget, setReturnTarget] = useState<Movement | null>(null);
  const [returnForm, setReturnForm] = useState({ returned_by_user_id: '', returned_by_name: '', notes: '' });


  const [entryForm, setEntryForm] = useState({
    quantity: 1,
    unit_cost: 0,
    date: getTodayLocalISODate(),
    supplier: '',
    reason: '',
  });

  // Filtros do histórico
  const [histType, setHistType] = useState('all');
  const [histFrom, setHistFrom] = useState('');
  const [histTo, setHistTo] = useState('');
  const [histPerson, setHistPerson] = useState('all');

  const canManage = canManageStock();
  // Nutricionista tem acesso somente leitura (materiais de cozinha e consumo)
  const isViewerOnly = !canManage && userRole === 'nutritionist';

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadItems(), loadMovements(), loadProfiles()]);
    setLoading(false);
  };

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) {
      console.error('[Estoque] erro ao carregar itens', error);
      return;
    }
    setItems((data || []) as StockItem[]);
  };

  const loadMovements = async () => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      console.error('[Estoque] erro ao carregar movimentações', error);
      return;
    }
    setMovements((data || []) as Movement[]);
  };

  const loadProfiles = async () => {
    const { data } = await supabase
      .from('profiles_public')
      .select('user_id, name')
      .order('name');
    setProfiles((data || []) as Array<{ user_id: string; name: string }>);
  };

  // ---------- Itens ----------
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchTerm =
        !term ||
        i.name?.toLowerCase().includes(term) ||
        (i.location || '').toLowerCase().includes(term) ||
        (i.supplier || '').toLowerCase().includes(term);
      const matchCat = categoryFilter === 'all' || (i.category || 'outros') === categoryFilter;
      // "todas" aparece em qualquer filtro de unidade
      const matchUnit =
        unitFilter === 'all' ||
        (i.clinic_unit || 'todas') === unitFilter ||
        (i.clinic_unit || 'todas') === 'todas';
      return matchTerm && matchCat && matchUnit;
    });
  }, [items, search, categoryFilter, unitFilter]);

  const stats = useMemo(() => {
    const monthPrefix = getTodayLocalISODate().slice(0, 7);
    const outs = movements.filter(
      (m) => m.type === 'out' && (m.withdrawal_date || m.date || '').startsWith(monthPrefix),
    );
    return {
      total: items.length,
      low: items.filter((i) => (i.current_quantity ?? 0) <= (i.minimum_quantity ?? 0)).length,
      withdrawalsMonth: outs.length,
      value: items.reduce((s, i) => s + (i.current_quantity || 0) * (i.unit_cost || 0), 0),
    };
  }, [items, movements]);

  const openNewItem = () => {
    setEditingId(null);
    setItemForm({ ...emptyItem });
    setItemDialog(true);
  };

  const openEditItem = (item: StockItem) => {
    setEditingId(item.id);
    setItemForm({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'outros',
      clinic_unit: item.clinic_unit || 'todas',
      unit: item.unit || 'unidade',
      current_quantity: item.current_quantity || 0,
      minimum_quantity: item.minimum_quantity || 0,
      unit_cost: item.unit_cost || 0,
      supplier: item.supplier || '',
      location: item.location || '',
    });
    setItemDialog(true);
  };

  const saveItem = async () => {
    if (!itemForm.name.trim()) {
      toast({ variant: 'destructive', title: 'Informe o nome do item' });
      return;
    }
    const payload = { ...itemForm, name: itemForm.name.toUpperCase() };
    const { data, error } = editingId
      ? await supabase.from('stock_items').update(payload).eq('id', editingId).select('*').single()
      : await supabase.from('stock_items').insert([{ ...payload, created_by: user?.id }]).select('*').single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar item', description: error.message });
      return;
    }
    // Atualiza somente a linha alterada (evita recarregar a tela inteira)
    const saved = data as StockItem;
    setItems((prev) =>
      editingId ? prev.map((i) => (i.id === editingId ? saved : i)) : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)),
    );
    toast({ title: editingId ? 'Item atualizado' : 'Item cadastrado' });
    setItemDialog(false);
  };

  const deleteItem = async (item: StockItem) => {
    if (!window.confirm(`Remover "${item.name}" do estoque?`)) return;
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== item.id)); // remoção otimista, sem flicker
    const { error } = await supabase.from('stock_items').update({ is_active: false }).eq('id', item.id);
    if (error) {
      setItems(previous);
      toast({ variant: 'destructive', title: 'Erro ao remover item', description: error.message });
      return;
    }
    toast({ title: 'Item removido' });
  };


  // ---------- Retirada ----------
  const openWithdraw = (item: StockItem) => {
    setTargetItem(item);
    setWithdrawForm({
      quantity: 1,
      withdrawn_by_user_id: user?.id || '',
      withdrawn_by_name: profiles.find((p) => p.user_id === user?.id)?.name || '',
      withdrawal_date: getTodayLocalISODate(),
      destination: item.location || '',
      expected_return_date: '',
      reason: '',
      generate_term: true,
    });

    setWithdrawDialog(true);
  };

  const confirmWithdraw = async () => {
    if (!targetItem) return;
    const qty = Number(withdrawForm.quantity);
    if (!qty || qty <= 0) {
      toast({ variant: 'destructive', title: 'Quantidade inválida' });
      return;
    }
    if (qty > (targetItem.current_quantity || 0)) {
      toast({ variant: 'destructive', title: 'Quantidade maior que o disponível' });
      return;
    }
    const personName =
      withdrawForm.withdrawn_by_name.trim().toUpperCase() ||
      profiles.find((p) => p.user_id === withdrawForm.withdrawn_by_user_id)?.name ||
      '';
    if (!personName) {
      toast({ variant: 'destructive', title: 'Informe quem está retirando o material' });
      return;
    }

    const previous = targetItem.current_quantity || 0;
    const { data, error } = await supabase.from('stock_movements').insert([
      {
        stock_item_id: targetItem.id,
        type: 'out',
        quantity: qty,
        unit_cost: targetItem.unit_cost || 0,
        total_cost: (targetItem.unit_cost || 0) * qty,
        date: withdrawForm.withdrawal_date,
        withdrawal_date: withdrawForm.withdrawal_date,
        withdrawn_by_user_id: withdrawForm.withdrawn_by_user_id || null,
        withdrawn_by_name: personName,
        clinic_unit: targetItem.clinic_unit || 'todas',
        destination: withdrawForm.destination || null,
        expected_return_date: withdrawForm.expected_return_date || null,
        reason: withdrawForm.reason || 'Retirada de material',
        previous_quantity: previous,
        new_quantity: Math.max(0, previous - qty),
        created_by: user?.id,
        moved_by: user?.id,
      },
    ]).select('*').single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao registrar retirada', description: error.message });
      return;
    }

    const newQty = Math.max(0, previous - qty);
    await supabase.from('stock_items').update({ current_quantity: newQty }).eq('id', targetItem.id);

    setMovements((prev) => [data as Movement, ...prev]);
    setItems((prev) => prev.map((i) => (i.id === targetItem.id ? { ...i, current_quantity: newQty } : i)));
    toast({ title: 'Retirada registrada', description: `${qty}x ${targetItem.name} para ${personName}` });
    setWithdrawDialog(false);

    if (withdrawForm.generate_term) {
      await printAuthorization(data as Movement, targetItem);
    }
  };

  // Termo de responsabilidade (impressão / assinatura)
  const printAuthorization = async (movement: Movement, item?: StockItem | null) => {
    const ref = item || items.find((i) => i.id === movement.stock_item_id) || null;
    try {
      const pdf = await generateStockAuthorizationPdf({
        itemName: ref?.name || 'Material',
        quantity: movement.quantity,
        unitLabel: ref?.unit,
        clinicUnitLabel: clinicUnitLabel(movement.clinic_unit || ref?.clinic_unit),
        responsibleName: movement.withdrawn_by_name || profileName(movement.withdrawn_by_user_id),
        destination: movement.destination,
        withdrawalDate: movement.withdrawal_date || movement.date,
        expectedReturnDate: movement.expected_return_date,
        reason: movement.reason,
        issuedBy: profiles.find((p) => p.user_id === user?.id)?.name || '',
      });
      pdf.save(`termo-retirada-${(ref?.name || 'material').toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao gerar termo', description: e?.message });
    }
  };

  // ---------- Devolução (controle de empréstimo) ----------
  const openReturn = (movement: Movement) => {
    setReturnTarget(movement);
    setReturnForm({
      returned_by_user_id: movement.withdrawn_by_user_id || '',
      returned_by_name: movement.withdrawn_by_name || '',
      notes: '',
    });
    setReturnDialog(true);
  };

  const registerReturn = async () => {
    const movement = returnTarget;
    if (!movement) return;
    const returnedBy = returnForm.returned_by_name.trim().toUpperCase();
    if (!returnedBy) {
      toast({ variant: 'destructive', title: 'Informe quem está devolvendo o material' });
      return;
    }
    const item = items.find((i) => i.id === movement.stock_item_id);
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from('stock_movements')
      .update({ returned_at: nowIso })
      .eq('id', movement.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao registrar devolução', description: error.message });
      return;
    }

    let restored: Movement | null = null;
    if (item) {
      const previousQty = item.current_quantity || 0;
      const newQty = previousQty + movement.quantity;
      const { data: inMov } = await supabase.from('stock_movements').insert([
        {
          stock_item_id: item.id,
          type: 'in',
          quantity: movement.quantity,
          unit_cost: item.unit_cost || 0,
          total_cost: (item.unit_cost || 0) * movement.quantity,
          date: getTodayLocalISODate(),
          clinic_unit: item.clinic_unit || 'todas',
          withdrawn_by_user_id: returnForm.returned_by_user_id || null,
          withdrawn_by_name: returnedBy,
          reason: `Devolução de ${returnedBy}`,
          notes: returnForm.notes || null,
          previous_quantity: previousQty,
          new_quantity: newQty,
          created_by: user?.id,
          moved_by: user?.id,
        },
      ]).select('*').single();
      restored = (inMov as Movement) || null;
      await supabase.from('stock_items').update({ current_quantity: newQty }).eq('id', item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, current_quantity: newQty } : i)));
    }

    const item = items.find((i) => i.id === movement.stock_item_id);
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from('stock_movements')
      .update({ returned_at: nowIso })
      .eq('id', movement.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao registrar devolução', description: error.message });
      return;
    }

    let restored: Movement | null = null;
    if (item) {
      const previousQty = item.current_quantity || 0;
      const newQty = previousQty + movement.quantity;
      const { data: inMov } = await supabase.from('stock_movements').insert([
        {
          stock_item_id: item.id,
          type: 'in',
          quantity: movement.quantity,
          unit_cost: item.unit_cost || 0,
          total_cost: (item.unit_cost || 0) * movement.quantity,
          date: getTodayLocalISODate(),
          clinic_unit: item.clinic_unit || 'todas',
          reason: `Devolução de ${movement.withdrawn_by_name || 'responsável'}`,
          previous_quantity: previousQty,
          new_quantity: newQty,
          created_by: user?.id,
          moved_by: user?.id,
        },
      ]).select('*').single();
      restored = (inMov as Movement) || null;
      await supabase.from('stock_items').update({ current_quantity: newQty }).eq('id', item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, current_quantity: newQty } : i)));
    }

    setMovements((prev) => {
      const updated = prev.map((m) => (m.id === movement.id ? { ...m, returned_at: nowIso } : m));
      return restored ? [restored, ...updated] : updated;
    });
    toast({ title: 'Devolução registrada' });
  };


  // ---------- Entrada ----------
  const openEntry = (item: StockItem) => {
    setTargetItem(item);
    setEntryForm({
      quantity: 1,
      unit_cost: item.unit_cost || 0,
      date: getTodayLocalISODate(),
      supplier: item.supplier || '',
      reason: '',
    });
    setEntryDialog(true);
  };

  const confirmEntry = async () => {
    if (!targetItem) return;
    const qty = Number(entryForm.quantity);
    if (!qty || qty <= 0) {
      toast({ variant: 'destructive', title: 'Quantidade inválida' });
      return;
    }
    const previous = targetItem.current_quantity || 0;
    const { data, error } = await supabase.from('stock_movements').insert([
      {
        stock_item_id: targetItem.id,
        type: 'in',
        quantity: qty,
        unit_cost: entryForm.unit_cost || 0,
        total_cost: (entryForm.unit_cost || 0) * qty,
        date: entryForm.date,
        clinic_unit: targetItem.clinic_unit || 'todas',
        reason: entryForm.reason || 'Entrada de material',
        previous_quantity: previous,
        new_quantity: previous + qty,
        created_by: user?.id,
        moved_by: user?.id,
      },
    ]).select('*').single();
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao registrar entrada', description: error.message });
      return;
    }

    await supabase
      .from('stock_items')
      .update({
        current_quantity: previous + qty,
        unit_cost: entryForm.unit_cost || targetItem.unit_cost || 0,
        supplier: entryForm.supplier || targetItem.supplier,
      })
      .eq('id', targetItem.id);

    setMovements((prev) => [data as Movement, ...prev]);
    setItems((prev) =>
      prev.map((i) =>
        i.id === targetItem.id
          ? {
              ...i,
              current_quantity: previous + qty,
              unit_cost: entryForm.unit_cost || i.unit_cost,
              supplier: entryForm.supplier || i.supplier,
            }
          : i,
      ),
    );
    toast({ title: 'Entrada registrada' });
    setEntryDialog(false);
  };


  // ---------- Histórico ----------
  const itemName = (id: string) => items.find((i) => i.id === id)?.name || '—';
  const profileName = (id?: string | null) =>
    profiles.find((p) => p.user_id === id)?.name || '—';

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const refDate = m.withdrawal_date || m.date;
      if (histType !== 'all' && m.type !== histType) return false;
      if (histFrom && refDate < histFrom) return false;
      if (histTo && refDate > histTo) return false;
      if (histPerson !== 'all' && m.withdrawn_by_user_id !== histPerson) return false;
      return true;
    });
  }, [movements, histType, histFrom, histTo, histPerson]);

  // Empréstimos em aberto (retiradas com previsão de devolução e sem devolução registrada)
  const pendingLoans = useMemo(() => {
    const today = getTodayLocalISODate();
    return movements
      .filter((m) => m.type === 'out' && m.expected_return_date && !m.returned_at)
      .map((m) => ({ ...m, overdue: (m.expected_return_date || '') < today }))
      .sort((a, b) => (a.expected_return_date || '').localeCompare(b.expected_return_date || ''));
  }, [movements]);



  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Controle de Estoque - Movimentações', 14, 15);
    doc.setFontSize(9);
    doc.text(`Emitido em ${formatDateBR(getTodayLocalISODate())}`, 14, 21);
    autoTable(doc, {
      startY: 26,
      head: [['Data', 'Item', 'Tipo', 'Qtd', 'Retirado por', 'Destino', 'Devolução', 'Registrado por']],
      body: filteredMovements.map((m) => [
        formatDateBR(m.withdrawal_date || m.date),
        itemName(m.stock_item_id),
        m.type === 'out' ? 'Retirada' : 'Entrada',
        String(m.quantity),
        m.withdrawn_by_name || (m.type === 'out' ? profileName(m.withdrawn_by_user_id) : '—'),
        m.destination || '—',
        m.expected_return_date ? formatDateBR(m.expected_return_date) : '—',
        profileName(m.created_by),
      ]),
      styles: { fontSize: 8 },
    });
    doc.save('estoque-movimentacoes.pdf');
  };

  if (roleLoading) {
    return <div className="p-6 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Boxes className="h-6 w-6 text-primary" />
            Controle de Estoque
          </h1>
          <p className="text-sm text-muted-foreground">
            Materiais físicos, entradas e retiradas com responsável e data.
          </p>
          {isViewerOnly && (
            <p className="text-xs text-muted-foreground mt-1">
              Acesso somente leitura — consulte itens de cozinha, consumo e materiais disponíveis.
            </p>
          )}
        </div>
        {canManage && (
          <Button onClick={openNewItem}>
            <Plus className="h-4 w-4 mr-2" /> Novo item
          </Button>
        )}
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Itens cadastrados</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Abaixo do mínimo</p>
            <p className="text-2xl font-semibold text-destructive">{stats.low}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Retiradas no mês</p>
            <p className="text-2xl font-semibold">{stats.withdrawalsMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Valor em estoque</p>
            <p className="text-2xl font-semibold">
              {stats.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="history">Retiradas e Entradas</TabsTrigger>
        </TabsList>

        {/* ITENS */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9"
                placeholder="Buscar item, local ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {CLINIC_UNITS.filter((u) => u.value !== 'todas').map((u) => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Mín.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  )}
                  {!loading && filteredItems.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum item encontrado.</TableCell></TableRow>
                  )}
                  {filteredItems.map((item) => {
                    const low = (item.current_quantity ?? 0) <= (item.minimum_quantity ?? 0);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[280px]">{item.description}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{categoryLabel(item.category)}</TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline">{clinicUnitLabel(item.clinic_unit)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{item.location || '—'}</TableCell>
                        <TableCell className="text-right">{item.current_quantity} {item.unit}</TableCell>
                        <TableCell className="text-right">{item.minimum_quantity}</TableCell>
                        <TableCell>
                          {low ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" /> Repor
                            </Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {canManage && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 mr-1" onClick={() => openWithdraw(item)}>
                                <ArrowUpFromLine className="h-3.5 w-3.5 mr-1" /> Retirar
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 mr-1" onClick={() => openEntry(item)}>
                                <ArrowDownToLine className="h-3.5 w-3.5 mr-1" /> Entrada
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => openEditItem(item)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={histType} onValueChange={setHistType}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="out">Retiradas</SelectItem>
                <SelectItem value="in">Entradas</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="h-9 w-[160px]" value={histFrom} onChange={(e) => setHistFrom(e.target.value)} />
            <Input type="date" className="h-9 w-[160px]" value={histTo} onChange={(e) => setHistTo(e.target.value)} />
            <Select value={histPerson} onValueChange={setHistPerson}>
              <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Quem retirou" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-9" onClick={exportPdf}>
              <FileDown className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead>Retirado por</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Devolução</TableHead>
                    <TableHead>Registrado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma movimentação.</TableCell></TableRow>
                  )}
                  {filteredMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap">{formatDateBR(m.withdrawal_date || m.date)}</TableCell>
                      <TableCell className="font-medium">{itemName(m.stock_item_id)}</TableCell>
                      <TableCell>
                        <Badge variant={m.type === 'out' ? 'destructive' : 'secondary'}>
                          {m.type === 'out' ? 'Retirada' : 'Entrada'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{m.quantity}</TableCell>
                      <TableCell>{m.withdrawn_by_name || (m.type === 'out' ? profileName(m.withdrawn_by_user_id) : '—')}</TableCell>
                      <TableCell>{m.destination || '—'}</TableCell>
                      <TableCell>{m.expected_return_date ? formatDateBR(m.expected_return_date) : '—'}</TableCell>
                      <TableCell>{profileName(m.created_by)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog item */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" /> {editingId ? 'Editar item' : 'Novo item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade da clínica</Label>
                <Select value={itemForm.clinic_unit} onValueChange={(v) => setItemForm({ ...itemForm, clinic_unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLINIC_UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade de medida</Label>
                <Select value={itemForm.unit} onValueChange={(v) => setItemForm({ ...itemForm, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min={0} value={itemForm.current_quantity}
                  onChange={(e) => setItemForm({ ...itemForm, current_quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Mínimo</Label>
                <Input type="number" min={0} value={itemForm.minimum_quantity}
                  onChange={(e) => setItemForm({ ...itemForm, minimum_quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Custo un. (R$)</Label>
                <Input type="number" min={0} step="0.01" value={itemForm.unit_cost}
                  onChange={(e) => setItemForm({ ...itemForm, unit_cost: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Local de guarda</Label>
                <Input value={itemForm.location} onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })} />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Input value={itemForm.supplier} onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={2} value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(false)}>Cancelar</Button>
            <Button onClick={saveItem}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog retirada */}
      <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5" /> Retirada de material
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {targetItem?.name} — disponível: {targetItem?.current_quantity} {targetItem?.unit}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantidade *</Label>
                <Input type="number" min={1} value={withdrawForm.quantity}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Data da retirada *</Label>
                <Input type="date" value={withdrawForm.withdrawal_date}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, withdrawal_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Quem retirou (funcionário cadastrado)</Label>
              <Select
                value={withdrawForm.withdrawn_by_user_id || 'none'}
                onValueChange={(v) => {
                  const id = v === 'none' ? '' : v;
                  setWithdrawForm({
                    ...withdrawForm,
                    withdrawn_by_user_id: id,
                    withdrawn_by_name: id
                      ? profiles.find((p) => p.user_id === id)?.name || withdrawForm.withdrawn_by_name
                      : withdrawForm.withdrawn_by_name,
                  });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Outra pessoa (digitar nome)</SelectItem>
                  {profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome de quem retirou *</Label>
              <Input
                placeholder="Ex.: CARLOS SILVA"
                value={withdrawForm.withdrawn_by_name}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, withdrawn_by_name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pode digitar livremente, mesmo para pessoas sem cadastro no sistema.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Destino / setor</Label>
                <Input placeholder="Ex.: Sala 3 - Madre" value={withdrawForm.destination}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, destination: e.target.value })} />
              </div>
              <div>
                <Label>Previsão de devolução</Label>
                <Input type="date" value={withdrawForm.expected_return_date}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, expected_return_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Motivo / observação</Label>
              <Textarea rows={2} value={withdrawForm.reason}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialog(false)}>Cancelar</Button>
            <Button onClick={confirmWithdraw}>Registrar retirada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog entrada */}
      <Dialog open={entryDialog} onOpenChange={setEntryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" /> Entrada de material
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{targetItem?.name}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantidade *</Label>
                <Input type="number" min={1} value={entryForm.quantity}
                  onChange={(e) => setEntryForm({ ...entryForm, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={entryForm.date}
                  onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Custo unitário (R$)</Label>
                <Input type="number" min={0} step="0.01" value={entryForm.unit_cost}
                  onChange={(e) => setEntryForm({ ...entryForm, unit_cost: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Input value={entryForm.supplier}
                  onChange={(e) => setEntryForm({ ...entryForm, supplier: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea rows={2} value={entryForm.reason}
                onChange={(e) => setEntryForm({ ...entryForm, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryDialog(false)}>Cancelar</Button>
            <Button onClick={confirmEntry}>Registrar entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
