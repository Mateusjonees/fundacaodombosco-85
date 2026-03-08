import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, MoreHorizontal, Phone, CalendarPlus, X, Clock, AlertTriangle, Users, Timer } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/page-header';

// Tipos de serviço disponíveis
const SERVICE_TYPES = [
  'Psicologia', 'Psicopedagogia', 'Fonoaudiologia', 'Nutrição',
  'Fisioterapia', 'Musicoterapia', 'Terapia Ocupacional',
  'Neuropsicologia', 'Psiquiatria', 'Neuropediatria', 'Outro'
];

const PRIORITY_CONFIG = {
  urgente: { label: 'Urgente', variant: 'destructive' as const, order: 0 },
  alta: { label: 'Alta', variant: 'warning' as const, order: 1 },
  normal: { label: 'Normal', variant: 'default' as const, order: 2 },
  baixa: { label: 'Baixa', variant: 'secondary' as const, order: 3 },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' }> = {
  waiting: { label: 'Aguardando', variant: 'warning' },
  contacted: { label: 'Contatado', variant: 'default' },
  scheduled: { label: 'Agendado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

interface WaitingListItem {
  id: string;
  client_id: string | null;
  patient_name: string;
  patient_phone: string | null;
  patient_email: string | null;
  service_type: string;
  preferred_professional: string | null;
  preferred_unit: string | null;
  preferred_shift: string | null;
  priority: string;
  status: string;
  notes: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
  position_order: number;
}

const WaitingList = () => {
  const { user } = useAuth();
  const { userName } = useCurrentUser();
  const { toast } = useToast();

  const [items, setItems] = useState<WaitingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WaitingListItem | null>(null);
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    service_type: '',
    preferred_unit: '',
    preferred_shift: '',
    priority: 'normal',
    reason: '',
    notes: '',
  });

  // Carregar fila de espera
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('waiting_list')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: 'Erro ao carregar fila de espera', variant: 'destructive' });
    } else {
      setItems((data as unknown as WaitingListItem[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  // Estatísticas
  const stats = useMemo(() => {
    const waiting = items.filter(i => i.status === 'waiting');
    const urgent = waiting.filter(i => i.priority === 'urgente');
    const avgDays = waiting.length > 0
      ? Math.round(waiting.reduce((sum, i) => sum + differenceInDays(new Date(), new Date(i.created_at)), 0) / waiting.length)
      : 0;
    return { total: waiting.length, urgent: urgent.length, avgDays };
  }, [items]);

  // Filtragem e ordenação
  const filteredItems = useMemo(() => {
    let result = items.filter(i => {
      if (filterPriority !== 'all' && i.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && i.status !== filterStatus) return false;
      if (filterUnit !== 'all' && i.preferred_unit !== filterUnit) return false;
      if (search && !i.patient_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    // Ordenar por prioridade e depois por data
    result.sort((a, b) => {
      const pa = PRIORITY_CONFIG[a.priority as keyof typeof PRIORITY_CONFIG]?.order ?? 99;
      const pb = PRIORITY_CONFIG[b.priority as keyof typeof PRIORITY_CONFIG]?.order ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return result;
  }, [items, filterPriority, filterStatus, filterUnit, search]);

  // Handlers
  const handleOpenDialog = (item?: WaitingListItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        patient_name: item.patient_name,
        patient_phone: item.patient_phone || '',
        patient_email: item.patient_email || '',
        service_type: item.service_type,
        preferred_unit: item.preferred_unit || '',
        preferred_shift: item.preferred_shift || '',
        priority: item.priority,
        reason: item.reason || '',
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        patient_name: '', patient_phone: '', patient_email: '',
        service_type: '', preferred_unit: '', preferred_shift: '',
        priority: 'normal', reason: '', notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.patient_name.trim() || !formData.service_type) {
      toast({ title: 'Preencha nome e tipo de serviço', variant: 'destructive' });
      return;
    }

    const payload = {
      patient_name: formData.patient_name.trim(),
      patient_phone: formData.patient_phone || null,
      patient_email: formData.patient_email || null,
      service_type: formData.service_type,
      preferred_unit: formData.preferred_unit || null,
      preferred_shift: formData.preferred_shift || null,
      priority: formData.priority,
      reason: formData.reason || null,
      notes: formData.notes || null,
      updated_at: new Date().toISOString(),
    };

    if (editingItem) {
      const { error } = await supabase
        .from('waiting_list')
        .update(payload)
        .eq('id', editingItem.id);
      if (error) {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
        return;
      }
      toast({ title: 'Registro atualizado com sucesso' });
    } else {
      const { error } = await supabase
        .from('waiting_list')
        .insert({ ...payload, created_by: user?.id || '' });
      if (error) {
        toast({ title: 'Erro ao adicionar', variant: 'destructive' });
        return;
      }
      toast({ title: 'Paciente adicionado à fila de espera' });
    }

    setDialogOpen(false);
    fetchItems();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const update: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'contacted') {
      update.notified_at = new Date().toISOString();
      update.notified_by = user?.id;
    }
    if (newStatus === 'scheduled') {
      update.scheduled_at = new Date().toISOString();
    }

    const { error } = await supabase.from('waiting_list').update(update).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    } else {
      toast({ title: `Status atualizado para ${STATUS_CONFIG[newStatus]?.label || newStatus}` });
      fetchItems();
    }
  };

  const getDaysWaiting = (createdAt: string) => differenceInDays(new Date(), new Date(createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fila de Espera"
        description="Gerencie pacientes aguardando vaga para atendimento"
      />

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Na fila</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.urgent}</p>
              <p className="text-sm text-muted-foreground">Urgentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgDays} dias</p>
              <p className="text-sm text-muted-foreground">Tempo médio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="waiting">Aguardando</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="madre">Madre</SelectItem>
                  <SelectItem value="floresta">Floresta</SelectItem>
                  <SelectItem value="atendimento_floresta">Atend. Floresta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleOpenDialog()} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" /> Adicionar à Fila
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Tempo na Fila</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum paciente na fila de espera
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const days = getDaysWaiting(item.created_at);
                  const priorityCfg = PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
                  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.waiting;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.patient_name}</p>
                          {item.patient_phone && (
                            <p className="text-xs text-muted-foreground">{item.patient_phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.service_type}</TableCell>
                      <TableCell>
                        <Badge variant={priorityCfg.variant}>{priorityCfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{item.preferred_unit || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={days > 30 ? 'text-destructive font-medium' : ''}>
                            {days} {days === 1 ? 'dia' : 'dias'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                              Editar
                            </DropdownMenuItem>
                            {item.status === 'waiting' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'contacted')}>
                                  <Phone className="h-4 w-4 mr-2" /> Marcar como Contatado
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'scheduled')}>
                                  <CalendarPlus className="h-4 w-4 mr-2" /> Marcar como Agendado
                                </DropdownMenuItem>
                              </>
                            )}
                            {item.status === 'contacted' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'scheduled')}>
                                <CalendarPlus className="h-4 w-4 mr-2" /> Marcar como Agendado
                              </DropdownMenuItem>
                            )}
                            {item.status !== 'cancelled' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.id, 'cancelled')}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" /> Cancelar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Registro' : 'Adicionar à Fila de Espera'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Paciente *</Label>
              <Input
                value={formData.patient_name}
                onChange={(e) => setFormData(p => ({ ...p, patient_name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.patient_phone}
                  onChange={(e) => setFormData(p => ({ ...p, patient_phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  value={formData.patient_email}
                  onChange={(e) => setFormData(p => ({ ...p, patient_email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Serviço *</Label>
                <Select value={formData.service_type} onValueChange={(v) => setFormData(p => ({ ...p, service_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgente">🔴 Urgente</SelectItem>
                    <SelectItem value="alta">🟠 Alta</SelectItem>
                    <SelectItem value="normal">🔵 Normal</SelectItem>
                    <SelectItem value="baixa">⚪ Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade Preferida</Label>
                <Select value={formData.preferred_unit} onValueChange={(v) => setFormData(p => ({ ...p, preferred_unit: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="madre">Madre</SelectItem>
                    <SelectItem value="floresta">Floresta</SelectItem>
                    <SelectItem value="atendimento_floresta">Atend. Floresta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Turno Preferido</Label>
                <Select value={formData.preferred_shift} onValueChange={(v) => setFormData(p => ({ ...p, preferred_shift: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="integral">Integral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo da Espera</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
                placeholder="Ex: Sem vaga no horário desejado"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaitingList;
