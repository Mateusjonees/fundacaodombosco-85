import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import { Plus, FileSignature, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageTransition } from '@/components/ui/page-transition';
import { SignatureCanvas } from '@/components/SignatureCanvas';

const CATEGORIES = ['TCLE', 'Autorização de Imagem', 'Termo de Responsabilidade', 'Contrato', 'Outro'];

const ConsentTerms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [witnessName, setWitnessName] = useState('');
  const [signClientId, setSignClientId] = useState('');
  const [templateForm, setTemplateForm] = useState({ title: '', content: '', category: 'TCLE' });

  const { data: templates = [] } = useQuery({
    queryKey: ['consent-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('consent_templates').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ['consent-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consent_records')
        .select('*, clients(name), consent_templates(title, category)')
        .order('signed_at', { ascending: false });
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

  const createTemplateMutation = useMutation({
    mutationFn: async (values: typeof templateForm) => {
      const { error } = await supabase.from('consent_templates').insert({
        title: values.title,
        content: values.content,
        category: values.category,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-templates'] });
      toast.success('Modelo criado');
      setTemplateDialogOpen(false);
      setTemplateForm({ title: '', content: '', category: 'TCLE' });
    },
    onError: () => toast.error('Erro ao criar modelo'),
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!signatureData || !signClientId || !selectedTemplate) throw new Error('Dados incompletos');
      const { error } = await supabase.from('consent_records').insert({
        client_id: signClientId,
        template_id: selectedTemplate.id,
        signature_data: signatureData,
        witness_name: witnessName || null,
        user_agent: navigator.userAgent,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-records'] });
      toast.success('Termo assinado com sucesso');
      setSignDialogOpen(false);
      setSignatureData(null);
      setWitnessName('');
      setSignClientId('');
    },
    onError: () => toast.error('Erro ao assinar termo'),
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Termos de Consentimento</h1>
            <p className="text-sm text-muted-foreground">Modelos e assinaturas digitais</p>
          </div>
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Modelo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Criar Modelo de Termo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Título *</Label>
                    <Input value={templateForm.title} onChange={e => setTemplateForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: TCLE para Atendimento" />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={templateForm.category} onValueChange={v => setTemplateForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Conteúdo do Termo *</Label>
                  <Textarea value={templateForm.content} onChange={e => setTemplateForm(f => ({ ...f, content: e.target.value }))} rows={10} placeholder="Escreva o conteúdo do termo aqui..." />
                </div>
                <Button className="w-full" onClick={() => createTemplateMutation.mutate(templateForm)} disabled={!templateForm.title || !templateForm.content || createTemplateMutation.isPending}>
                  {createTemplateMutation.isPending ? 'Criando...' : 'Criar Modelo'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sign Dialog */}
        <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Assinar Termo: {selectedTemplate?.title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {selectedTemplate && (
                <div className="bg-muted/50 p-4 rounded-lg max-h-48 overflow-y-auto text-sm whitespace-pre-wrap">
                  {selectedTemplate.content}
                </div>
              )}
              <div>
                <Label>Paciente *</Label>
                <Select value={signClientId} onValueChange={setSignClientId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Testemunha (opcional)</Label>
                <Input value={witnessName} onChange={e => setWitnessName(e.target.value)} placeholder="Nome da testemunha" />
              </div>
              <div>
                <Label>Assinatura *</Label>
                <SignatureCanvas onSignatureChange={setSignatureData} />
              </div>
              <Button className="w-full" onClick={() => signMutation.mutate()} disabled={!signatureData || !signClientId || signMutation.isPending}>
                <FileSignature className="h-4 w-4 mr-2" />
                {signMutation.isPending ? 'Assinando...' : 'Confirmar Assinatura'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="templates">
          <TabsList>
            <TabsTrigger value="templates">Modelos ({templates.length})</TabsTrigger>
            <TabsTrigger value="records">Assinados ({records.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-3 mt-4">
            {templates.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum modelo criado</CardContent></Card> :
            templates.map((t: any) => (
              <Card key={t.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{t.category}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => { setSelectedTemplate(t); setSignDialogOpen(true); }}>
                    <FileSignature className="h-3 w-3 mr-1" />Assinar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="records" className="space-y-3 mt-4">
            {records.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum termo assinado</CardContent></Card> :
            records.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{(r as any).consent_templates?.title}</p>
                    <p className="text-sm text-muted-foreground">{(r as any).clients?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{(r as any).consent_templates?.category}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(r.signed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      {r.witness_name && <span className="text-xs text-muted-foreground">• Testemunha: {r.witness_name}</span>}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Assinado</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default ConsentTerms;
