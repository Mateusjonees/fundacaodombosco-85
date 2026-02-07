import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import { Plus, Phone, X, Clock, Users, AlertTriangle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageTransition } from '@/components/ui/page-transition';

const SPECIALTIES = [
  'Psicologia', 'Psicopedagogia', 'Fonoaudiologia', 'Musicoterapia',
  'Nutrição', 'Fisioterapia', 'Terapia Ocupacional', 'Psiquiatria', 'Neuropediatria'
];
const UNITS = ['Madre', 'Floresta', 'Atendimento Floresta'];
const PRIORITIES = [
  { value: 'normal', label: 'Normal', color: 'bg-muted text-muted-foreground' },
  { value: 'high', label: 'Alta', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'urgent', label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
];

const WaitList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Form state
  const [form, setForm] = useState({ client_id: '', specialty: '', unit: 'Madre', priority: 'normal', notes: '' });

  const { data: waitList = [], isLoading } = useQuery({
    queryKey: ['wait-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wait_list')
        .select('*, clients(name, phone)')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-simple'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const maxPos = waitList.filter(w => w.status === 'waiting').length;
      const { error } = await supabase.from('wait_list').insert({
        client_id: values.client_id,
        specialty: values.specialty,
        unit: values.unit,
        priority: values.priority,
        notes: values.notes || null,
        position: maxPos + 1,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wait-list'] });
      toast.success('Paciente adicionado à fila');
      setDialogOpen(false);
      setForm({ client_id: '', specialty: '', unit: 'Madre', priority: 'normal', notes: '' });
    },
    onError: () => toast.error('Erro ao adicionar à fila'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('wait_list').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['wait-list'] });
      toast.success(status === 'called' ? 'Paciente chamado!' : 'Registro cancelado');
    },
  });

  const filtered = waitList.filter((item: any) => {
    if (filterUnit !== 'all' && item.unit !== filterUnit) return false;
    if (filterSpecialty !== 'all' && item.specialty !== filterSpecialty) return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    if (search && !(item.clients as any)?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const waiting = filtered.filter((i: any) => i.status === 'waiting');
  const called = filtered.filter((i: any) => i.status === 'called');

  const stats = {
    total: waitList.filter((i: any) => i.status === 'waiting').length,
    urgent: waitList.filter((i: any) => i.status === 'waiting' && i.priority === 'urgent').length,
    high: waitList.filter((i: any) => i.status === 'waiting' && i.priority === 'high').length,
  };

  const getPriorityConfig = (p: string) => PRIORITIES.find(pr => pr.value === p) || PRIORITIES[0];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fila de Espera</h1>
            <p className="text-sm text-muted-foreground">Gerencie pacientes aguardando vaga</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Adicionar à Fila</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Paciente à Fila</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Paciente *</Label>
                  <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Especialidade *</Label>
                  <Select value={form.specialty} onValueChange={v => setForm(f => ({ ...f, specialty: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Unidade</Label>
                    <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={() => addMutation.mutate(form)} disabled={!form.client_id || !form.specialty || addMutation.isPending}>
                  {addMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Na fila</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{stats.high}</p><p className="text-xs text-muted-foreground">Prioridade Alta</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-2xl font-bold">{stats.urgent}</p><p className="text-xs text-muted-foreground">Urgentes</p></div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          <Select value={filterUnit} onValueChange={setFilterUnit}>
            <SelectTrigger className="w-40"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Unidades</SelectItem>
              {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Especialidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Wait List Table */}
        <Card>
          <CardHeader><CardTitle>Aguardando ({waiting.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> :
            waiting.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum paciente na fila</p> :
            <div className="space-y-2">
              {waiting.map((item: any, idx: number) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-8 text-center">{idx + 1}</span>
                    <div>
                      <p className="font-medium">{item.clients?.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{item.specialty}</Badge>
                        <Badge variant="outline" className="text-xs">{item.unit}</Badge>
                        <Badge className={`text-xs ${getPriorityConfig(item.priority).color}`}>{getPriorityConfig(item.priority).label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Desde {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        {item.notes && ` • ${item.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'called' })}>
                      <Phone className="h-3 w-3 mr-1" />Chamar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'cancelled' })}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>

        {called.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-muted-foreground">Chamados ({called.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {called.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium text-muted-foreground">{item.clients?.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{item.specialty}</Badge>
                        <Badge variant="outline" className="text-xs">{item.unit}</Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">Chamado</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default WaitList;
