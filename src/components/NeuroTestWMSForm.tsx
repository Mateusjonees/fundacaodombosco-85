import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateWMSResults, type WMSResults } from '@/data/neuroTests/wms';

interface Props {
  patientAge: number;
  onResultsChange: (results: WMSResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestWMSForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [memoriaImediata, setMemoriaImediata] = useState<string>('');
  const [memoriaTargia, setMemoriaTargia] = useState<string>('');
  const [memoriaTrabalho, setMemoriaTrabalho] = useState<string>('');
  const [reconhecimentoVisual, setReconhecimentoVisual] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const mi = parseInt(memoriaImediata);
    const mt = parseInt(memoriaTargia);
    const mtrab = parseInt(memoriaTrabalho);
    const rv = parseInt(reconhecimentoVisual);
    if ([mi, mt, mtrab, rv].some(v => !isNaN(v) && v > 0)) {
      onResultsChange(calculateWMSResults(mi || 0, mt || 0, mtrab || 0, rv || 0));
    } else {
      onResultsChange(null);
    }
  }, [memoriaImediata, memoriaTargia, memoriaTrabalho, reconhecimentoVisual]);

  const getClassColor = (classification: string) => {
    if (classification.includes('Extremamente') || classification === 'Limítrofe') return 'bg-destructive text-destructive-foreground';
    if (classification === 'Médio Inferior') return 'bg-orange-500 text-white';
    if (classification === 'Médio') return 'bg-primary text-primary-foreground';
    if (classification === 'Médio Superior' || classification === 'Superior') return 'bg-green-600 text-white';
    if (classification === 'Muito Superior') return 'bg-green-700 text-white';
    return 'bg-muted';
  };

  const mi = parseInt(memoriaImediata);
  const mt = parseInt(memoriaTargia);
  const mtrab = parseInt(memoriaTrabalho);
  const rv = parseInt(reconhecimentoVisual);
  const hasData = [mi, mt, mtrab, rv].some(v => !isNaN(v) && v > 0);
  const results = hasData ? calculateWMSResults(mi || 0, mt || 0, mtrab || 0, rv || 0) : null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            WMS-IV - Escala de Memória Wechsler
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avalia funções de memória • 16-90 anos • M=100, DP=15</p>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline w-full">
              <Info className="h-3 w-3" />
              <span>Instruções de aplicação</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showInstructions ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-2.5 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1">
              <p>• Avalia memória em 4 índices compostos.</p>
              <p>• Insira os índices padronizados já calculados (M=100, DP=15).</p>
              <p>• Memória Imediata: retenção logo após a apresentação.</p>
              <p>• Memória Tardia: retenção após intervalo de tempo.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Índices Padronizados</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Memória Imediata</Label>
              <Input type="number" min="40" max="160" value={memoriaImediata} onChange={(e) => setMemoriaImediata(e.target.value)} placeholder="100" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Memória Tardia</Label>
              <Input type="number" min="40" max="160" value={memoriaTargia} onChange={(e) => setMemoriaTargia(e.target.value)} placeholder="100" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Memória de Trabalho</Label>
              <Input type="number" min="40" max="160" value={memoriaTrabalho} onChange={(e) => setMemoriaTrabalho(e.target.value)} placeholder="100" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Reconhecimento Visual</Label>
              <Input type="number" min="40" max="160" value={reconhecimentoVisual} onChange={(e) => setReconhecimentoVisual(e.target.value)} placeholder="100" className="h-9 mt-1" />
            </div>
          </div>
        </div>

        {results && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
            <div className="flex flex-wrap gap-2">
              {mi > 0 && <Badge className={getClassColor(results.classifications.memoriaImediata)}>MI: {results.classifications.memoriaImediata}</Badge>}
              {mt > 0 && <Badge className={getClassColor(results.classifications.memoriaTargia)}>MT: {results.classifications.memoriaTargia}</Badge>}
              {mtrab > 0 && <Badge className={getClassColor(results.classifications.memoriaTrabalho)}>MTrab: {results.classifications.memoriaTrabalho}</Badge>}
              {rv > 0 && <Badge className={getClassColor(results.classifications.reconhecimentoVisual)}>RV: {results.classifications.reconhecimentoVisual}</Badge>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
