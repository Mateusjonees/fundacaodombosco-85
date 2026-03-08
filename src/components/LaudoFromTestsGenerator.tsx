import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileCheck2, Sparkles, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { getTodayLocalISODate } from '@/lib/utils';
import {
  TestDataForLaudo,
  getDomain,
  getTestFullName,
  generateLaudoDraft,
  groupTestsByDomain,
} from '@/utils/laudoTextGenerator';

interface LaudoFromTestsGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tests: TestDataForLaudo[];
  clientId: string;
  clientName: string;
  clientBirthDate?: string;
}

const LAUDO_TYPES = [
  { value: 'neuropsicologico', label: 'Neuropsicológico' },
  { value: 'psicologico', label: 'Psicológico' },
  { value: 'fonoaudiologico', label: 'Fonoaudiológico' },
  { value: 'medico', label: 'Médico' },
  { value: 'outro', label: 'Outro' },
];

export default function LaudoFromTestsGenerator({
  open,
  onOpenChange,
  tests,
  clientId,
  clientName,
  clientBirthDate,
}: LaudoFromTestsGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Step: 1 = selecionar testes, 2 = editar rascunho
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draftText, setDraftText] = useState('');
  const [laudoType, setLaudoType] = useState('neuropsicologico');
  const [laudoDate, setLaudoDate] = useState(getTodayLocalISODate());
  const [diagnosisText, setDiagnosisText] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleTest = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === tests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tests.map(t => t.id)));
    }
  };

  const handleGenerate = () => {
    const selected = tests.filter(t => selectedIds.has(t.id));
    if (selected.length === 0) {
      toast({ variant: 'destructive', title: 'Selecione ao menos um teste' });
      return;
    }
    const draft = generateLaudoDraft(clientName, clientBirthDate, selected);
    setDraftText(draft);
    setStep(2);
  };

  const handleSave = async () => {
    if (!user || !draftText.trim()) return;
    setSaving(true);
    try {
      const typeLabel = LAUDO_TYPES.find(t => t.value === laudoType)?.label || 'Laudo';
      const dateFormatted = new Date(laudoDate + 'T12:00:00').toLocaleDateString('pt-BR');
      const title = `${typeLabel} - ${dateFormatted}`;

      const { error } = await supabase.from('client_laudos').insert({
        client_id: clientId,
        employee_id: user.id,
        laudo_date: laudoDate,
        laudo_type: laudoType,
        title,
        description: draftText.trim(),
      });

      if (error) throw error;

      // Atualizar diagnóstico se preenchido
      if (diagnosisText.trim()) {
        await supabase
          .from('clients')
          .update({ diagnosis: diagnosisText.trim() })
          .eq('id', clientId);
      }

      queryClient.invalidateQueries({ queryKey: ['laudos', clientId] });

      toast({ title: 'Laudo criado com sucesso!', description: 'O rascunho foi salvo na aba Laudos.' });
      handleClose();
    } catch (error) {
      console.error('Error saving laudo:', error);
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedIds(new Set());
    setDraftText('');
    setDiagnosisText('');
    setLaudoType('neuropsicologico');
    setLaudoDate(getTodayLocalISODate());
    onOpenChange(false);
  };

  // Agrupa testes por domínio para seleção
  const grouped = groupTestsByDomain(tests);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            {step === 1 ? 'Selecionar Testes para o Laudo' : 'Revisar Rascunho do Laudo'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            {/* Selecionar/Desmarcar todos */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Marque os testes que deseja incluir no laudo
              </p>
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedIds.size === tests.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
            </div>

            {/* Lista agrupada por domínio */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {Object.entries(grouped).map(([domain, domainTests]) => (
                <div key={domain}>
                  <h4 className="text-sm font-semibold text-primary mb-2">{domain}</h4>
                  <div className="space-y-1.5">
                    {domainTests.map(test => (
                      <label
                        key={test.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedIds.has(test.id)}
                          onCheckedChange={() => toggleTest(test.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate">
                            {getTestFullName(test.test_code, test.test_name)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(test.applied_at).toLocaleDateString('pt-BR')} • {test.patient_age} anos
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleGenerate} disabled={selectedIds.size === 0} className="gap-2">
                Gerar Rascunho
                <ChevronRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* Tipo e Data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Data</Label>
                <Input type="date" value={laudoDate} onChange={e => setLaudoDate(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Tipo</Label>
                <Select value={laudoType} onValueChange={setLaudoType}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAUDO_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Texto do laudo */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Rascunho do Laudo</Label>
              <Textarea
                value={draftText}
                onChange={e => setDraftText(e.target.value)}
                rows={16}
                className="font-mono text-xs resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Edite o texto acima antes de salvar. Os campos entre [colchetes] precisam ser preenchidos manualmente.
              </p>
            </div>

            {/* Diagnóstico */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Diagnóstico
                <span className="text-xs text-muted-foreground font-normal">(opcional, atualiza o cadastro)</span>
              </Label>
              <Input
                placeholder="Ex: TEA, TDAH, Dislexia..."
                value={diagnosisText}
                onChange={e => setDiagnosisText(e.target.value)}
                className="h-10"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleSave} disabled={saving || !draftText.trim()} className="gap-2">
                <FileCheck2 className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar como Laudo'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
