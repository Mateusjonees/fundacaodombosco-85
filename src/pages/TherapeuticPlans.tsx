import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import { Plus, Target, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageTransition } from '@/components/ui/page-transition';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  paused: { label: 'Pausado', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: 'Concluído', color: 'bg-primary/10 text-primary' },
};

const TherapeuticPlans = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [progressValue, setProgressValue] = useState(50);
  const [progressNotes, setProgressNotes] = useState('');
  const [planForm, setPlanForm] = useState({ client_id: '', title: '', objectives: '', start_date: format(new Date(), 'yyyy-MM-dd') });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['therapeutic-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('therapeutic_plans')
        .select('*, clients(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['therapeutic-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('therapeutic_progress')
        .select('*')
        .order('session_date', { ascending: true });
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

  const createPlanMutation = useMutation({
    mutationFn: async (values: typeof planForm) => {
      const objectives = values.objectives.split('\n').filter(Boolean).map(o => ({ text: o.trim(), completed: false }));
      const { error } = await supabase.from('therapeutic_plans').insert({
        client_id: values.client_id,
        title: values.title,
        objectives,
        start_date: values.start_date,
        professional_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapeutic-plans'] });
      toast.success('Plano criado');
      setPlanDialogOpen(false);
      setPlanForm({ client_id: '', title: '', objectives: '', start_date: format(new Date(), 'yyyy-MM-dd') });
    },
    onError: () => toast.error('Erro ao criar plano'),
  });

  const addProgressMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) return;
      const { error } = await supabase.from('therapeutic_progress').insert({
        plan_id: selectedPlan,
        progress_value: progressValue,
        notes: progressNotes || null,
        recorded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapeutic-progress'] });
      toast.success('Progresso registrado');
      setProgressDialogOpen(false);
      setProgressValue(50);
      setProgressNotes('');
    },
    onError: () => toast.error('Erro ao registrar progresso'),
  });

  const toggleExpand = (id: string) => {
    setExpandedPlans(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getProgressForPlan = (planId: string) => progress.filter((p: any) => p.plan_id === planId);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Planos Terapêuticos</h1>
            <p className="text-sm text-muted-foreground">PTI/PEI - Acompanhamento de metas</p>
          </div>
          <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Plano</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Plano Terapêutico</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Paciente *</Label>
                  <Select value={planForm.client_id} onValueChange={v => setPlanForm(f => ({ ...f, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título *</Label>
                  <Input value={planForm.title} onChange={e => setPlanForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: PTI - Linguagem Expressiva" />
                </div>
                <div>
                  <Label>Data de Início</Label>
                  <Input type="date" value={planForm.start_date} onChange={e => setPlanForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Objetivos (um por linha)</Label>
                  <Textarea value={planForm.objectives} onChange={e => setPlanForm(f => ({ ...f, objectives: e.target.value }))} placeholder={"Melhorar articulação de fonemas\nAmpliar vocabulário receptivo\nDesenvolver narrativa oral"} rows={5} />
                </div>
                <Button className="w-full" onClick={() => createPlanMutation.mutate(planForm)} disabled={!planForm.client_id || !planForm.title || createPlanMutation.isPending}>
                  {createPlanMutation.isPending ? 'Criando...' : 'Criar Plano'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress Dialog */}
        <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Progresso</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Progresso: {progressValue}%</Label>
                <Slider value={[progressValue]} onValueChange={v => setProgressValue(v[0])} max={100} step={5} className="mt-2" />
              </div>
              <div>
                <Label>Observações da sessão</Label>
                <Textarea value={progressNotes} onChange={e => setProgressNotes(e.target.value)} placeholder="Descreva o progresso observado..." />
              </div>
              <Button className="w-full" onClick={() => addProgressMutation.mutate()} disabled={addProgressMutation.isPending}>
                {addProgressMutation.isPending ? 'Salvando...' : 'Registrar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Plans List */}
        {isLoading ? <p className="text-muted-foreground">Carregando...</p> :
        plans.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum plano terapêutico criado</CardContent></Card> :
        <div className="space-y-4">
          {plans.map((plan: any) => {
            const planProgress = getProgressForPlan(plan.id);
            const lastProgress = planProgress[planProgress.length - 1];
            const isExpanded = expandedPlans.has(plan.id);
            const objectives = Array.isArray(plan.objectives) ? plan.objectives : [];
            const statusConf = STATUS_CONFIG[plan.status] || STATUS_CONFIG.active;

            return (
              <Card key={plan.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(plan.id)}>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <Target className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <CardTitle className="text-base">{plan.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{plan.clients?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lastProgress && <span className="text-sm font-bold text-primary">{lastProgress.progress_value}%</span>}
                          <Badge className={statusConf.color}>{statusConf.label}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Objectives */}
                      {objectives.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Objetivos:</p>
                          <ul className="space-y-1">
                            {objectives.map((obj: any, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>{typeof obj === 'string' ? obj : obj.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Progress Chart */}
                      {planProgress.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Evolução:</p>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={planProgress.map((p: any) => ({
                              date: format(new Date(p.session_date), 'dd/MM'),
                              progresso: p.progress_value,
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis dataKey="date" className="text-xs" />
                              <YAxis domain={[0, 100]} className="text-xs" />
                              <Tooltip />
                              <Line type="monotone" dataKey="progresso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <Button size="sm" onClick={() => { setSelectedPlan(plan.id); setProgressDialogOpen(true); }}>
                        <TrendingUp className="h-3 w-3 mr-1" />Registrar Progresso
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>}
      </div>
    </PageTransition>
  );
};

export default TherapeuticPlans;
