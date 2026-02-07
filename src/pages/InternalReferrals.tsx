import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import { Plus, ArrowRight, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageTransition } from '@/components/ui/page-transition';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  accepted: { label: 'Aceito', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Check },
  in_progress: { label: 'Em Andamento', color: 'bg-primary/10 text-primary', icon: ArrowRight },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: Check },
  rejected: { label: 'Recusado', color: 'bg-destructive/10 text-destructive', icon: X },
};

const InternalReferrals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseDialog, setResponseDialog] = useState<{ open: boolean; referral: any; action: string }>({ open: false, referral: null, action: '' });
  const [responseNotes, setResponseNotes] = useState('');
  const [form, setForm] = useState({ client_id: '', to_professional: '', reason: '', notes: '' });

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['internal-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_referrals')
        .select('*, clients(name)')
        .order('created_at', { ascending: false });
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

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, name, employee_role').not('employee_role', 'is', null).eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from('internal_referrals').insert({
        client_id: values.client_id,
        from_professional: user?.id,
        to_professional: values.to_professional,
        reason: values.reason,
        notes: values.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-referrals'] });
      toast.success('Encaminhamento criado');
      setDialogOpen(false);
      setForm({ client_id: '', to_professional: '', reason: '', notes: '' });
    },
    onError: () => toast.error('Erro ao criar encaminhamento'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, response_notes }: { id: string; status: string; response_notes?: string }) => {
      const { error } = await supabase.from('internal_referrals').update({ status, response_notes: response_notes || null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-referrals'] });
      toast.success('Status atualizado');
      setResponseDialog({ open: false, referral: null, action: '' });
      setResponseNotes('');
    },
  });

  const sent = referrals.filter((r: any) => r.from_professional === user?.id);
  const received = referrals.filter((r: any) => r.to_professional === user?.id);

  const getProfName = (id: string) => professionals.find((p: any) => p.user_id === id)?.name || 'Desconhecido';

  const ReferralCard = ({ r, showActions }: { r: any; showActions: boolean }) => {
    const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-medium">{r.clients?.name}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>{getProfName(r.from_professional)}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{getProfName(r.to_professional)}</span>
              </div>
              <p className="text-sm">{r.reason}</p>
              {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
              {r.response_notes && <p className="text-xs text-primary mt-1">Resposta: {r.response_notes}</p>}
              <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={status.color}>{status.label}</Badge>
              {showActions && r.status === 'pending' && (
                <div className="flex gap-1">
                  <Button size="sm" variant="default" onClick={() => setResponseDialog({ open: true, referral: r, action: 'accepted' })}>
                    <Check className="h-3 w-3 mr-1" />Aceitar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setResponseDialog({ open: true, referral: r, action: 'rejected' })}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {showActions && r.status === 'accepted' && (
                <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'in_progress' })}>
                  Iniciar
                </Button>
              )}
              {showActions && r.status === 'in_progress' && (
                <Button size="sm" variant="default" onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'completed' })}>
                  Concluir
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Encaminhamentos Internos</h1>
            <p className="text-sm text-muted-foreground">Fluxo de encaminhamento entre profissionais</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Encaminhamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Encaminhamento</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Paciente *</Label>
                  <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Profissional Destino *</Label>
                  <Select value={form.to_professional} onValueChange={v => setForm(f => ({ ...f, to_professional: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{professionals.filter((p: any) => p.user_id !== user?.id).map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Motivo *</Label>
                  <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Motivo do encaminhamento..." />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={!form.client_id || !form.to_professional || !form.reason || createMutation.isPending}>
                  {createMutation.isPending ? 'Criando...' : 'Criar Encaminhamento'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Response Dialog */}
        <Dialog open={responseDialog.open} onOpenChange={o => setResponseDialog(p => ({ ...p, open: o }))}>
          <DialogContent>
            <DialogHeader><DialogTitle>{responseDialog.action === 'accepted' ? 'Aceitar' : 'Recusar'} Encaminhamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Observações</Label>
                <Textarea value={responseNotes} onChange={e => setResponseNotes(e.target.value)} placeholder="Observações sobre a decisão..." />
              </div>
              <Button className="w-full" onClick={() => responseDialog.referral && updateStatusMutation.mutate({
                id: responseDialog.referral.id,
                status: responseDialog.action,
                response_notes: responseNotes,
              })}>Confirmar</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="received">
          <TabsList>
            <TabsTrigger value="received">Recebidos ({received.length})</TabsTrigger>
            <TabsTrigger value="sent">Enviados ({sent.length})</TabsTrigger>
            <TabsTrigger value="all">Todos ({referrals.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="received" className="space-y-3 mt-4">
            {received.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum encaminhamento recebido</p> :
            received.map((r: any) => <ReferralCard key={r.id} r={r} showActions />)}
          </TabsContent>
          <TabsContent value="sent" className="space-y-3 mt-4">
            {sent.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum encaminhamento enviado</p> :
            sent.map((r: any) => <ReferralCard key={r.id} r={r} showActions={false} />)}
          </TabsContent>
          <TabsContent value="all" className="space-y-3 mt-4">
            {referrals.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum encaminhamento</p> :
            referrals.map((r: any) => <ReferralCard key={r.id} r={r} showActions={r.to_professional === user?.id} />)}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default InternalReferrals;
