import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Calendar, Users, TrendingDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageTransition } from '@/components/ui/page-transition';

const AbsenceControl = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('30');
  const [form, setForm] = useState({ client_id: '', absence_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });

  const startDate = format(subDays(new Date(), parseInt(period)), 'yyyy-MM-dd');

  const { data: absences = [], isLoading } = useQuery({
    queryKey: ['absence-records', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absence_records')
        .select('*, clients(name, phone)')
        .gte('absence_date', startDate)
        .order('absence_date', { ascending: false });
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
      // Calcular faltas consecutivas
      const { data: prevAbsences } = await supabase
        .from('absence_records')
        .select('id')
        .eq('client_id', values.client_id)
        .order('absence_date', { ascending: false })
        .limit(10);
      
      const consecutiveCount = (prevAbsences?.length || 0) + 1;

      const { error } = await supabase.from('absence_records').insert({
        client_id: values.client_id,
        absence_date: values.absence_date,
        consecutive_count: consecutiveCount,
        notes: values.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence-records'] });
      toast.success('Falta registrada');
      setDialogOpen(false);
      setForm({ client_id: '', absence_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
    },
    onError: () => toast.error('Erro ao registrar falta'),
  });

  // Agrupar por paciente para detectar recorrentes
  const byClient = absences.reduce((acc: any, a: any) => {
    const name = a.clients?.name || 'Desconhecido';
    if (!acc[name]) acc[name] = { name, count: 0, absences: [] };
    acc[name].count++;
    acc[name].absences.push(a);
    return acc;
  }, {});
  const recurrents = Object.values(byClient).filter((c: any) => c.count >= 2).sort((a: any, b: any) => b.count - a.count);

  const filtered = absences.filter((a: any) => {
    if (search && !(a.clients as any)?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: absences.length,
    uniquePatients: new Set(absences.map((a: any) => a.client_id)).size,
    recurrent: recurrents.length,
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Controle de Faltas</h1>
            <p className="text-sm text-muted-foreground">Dashboard de comparecimento e alertas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Registrar Falta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Falta</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Paciente *</Label>
                  <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data da Falta</Label>
                  <Input type="date" value={form.absence_date} onChange={e => setForm(f => ({ ...f, absence_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={() => addMutation.mutate(form)} disabled={!form.client_id || addMutation.isPending}>
                  {addMutation.isPending ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><Calendar className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Faltas no período</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Users className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{stats.uniquePatients}</p><p className="text-xs text-muted-foreground">Pacientes faltosos</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><TrendingDown className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-2xl font-bold">{stats.recurrent}</p><p className="text-xs text-muted-foreground">Recorrentes (2+)</p></div>
          </CardContent></Card>
        </div>

        {/* Alertas de recorrência */}
        {recurrents.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Pacientes com Faltas Recorrentes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(recurrents as any[]).map((r: any) => (
                  <div key={r.name} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">Última falta: {format(new Date(r.absences[0].absence_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                    <Badge variant="destructive">{r.count} faltas</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters + List */}
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader><CardTitle>Registro de Faltas ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> :
            filtered.length === 0 ? <p className="text-muted-foreground text-sm">Nenhuma falta registrada no período</p> :
            <div className="space-y-2">
              {filtered.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="font-medium">{a.clients?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(a.absence_date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                      {a.notes && ` • ${a.notes}`}
                    </p>
                  </div>
                  <Badge variant={a.consecutive_count >= 3 ? 'destructive' : a.consecutive_count >= 2 ? 'secondary' : 'outline'}>
                    {a.consecutive_count}ª falta
                  </Badge>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default AbsenceControl;
