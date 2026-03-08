import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateBRIEF2Results, getBRIEF2Classification, type BRIEF2Results } from '@/data/neuroTests/brief2';

interface Props {
  patientAge: number;
  onResultsChange: (results: BRIEF2Results | null) => void;
  onRemove?: () => void;
}

const fields = [
  { key: 'inibicao', label: 'Inibição (T)' },
  { key: 'autocontrole', label: 'Autocontrole (T)' },
  { key: 'flexibilidade', label: 'Flexibilidade (T)' },
  { key: 'regulacaoEmocional', label: 'Regulação Emocional (T)' },
  { key: 'iniciativa', label: 'Iniciativa (T)' },
  { key: 'memoriaTrabalho', label: 'Memória de Trabalho (T)' },
  { key: 'planejamento', label: 'Planejamento/Org. (T)' },
  { key: 'monitoramento', label: 'Monitoramento (T)' },
  { key: 'bri', label: 'BRI - Reg. Comportamental (T)' },
  { key: 'eri', label: 'ERI - Reg. Emocional (T)' },
  { key: 'cri', label: 'CRI - Reg. Cognitiva (T)' },
  { key: 'gec', label: 'GEC - Índice Global (T)' },
];

export default function NeuroTestBRIEF2Form({ patientAge, onResultsChange, onRemove }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const parsed: Record<string, number> = {};
    let allValid = true;
    for (const f of fields) {
      const v = parseInt(scores[f.key] || '');
      if (isNaN(v) || v < 20 || v > 100) { allValid = false; break; }
      parsed[f.key] = v;
    }
    if (allValid) {
      onResultsChange(calculateBRIEF2Results(parsed as any));
    } else {
      onResultsChange(null);
    }
  }, [scores]);

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c.includes('Levemente')) return 'bg-yellow-500 text-white';
    if (c.includes('Potencialmente')) return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            BRIEF-2 - Inventário de Funções Executivas
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avalia funções executivas em crianças e adolescentes • 5-18 anos</p>
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
              <p>• Questionário respondido por pais/responsáveis ou professores.</p>
              <p>• Insira os escores T já calculados para cada escala e índice.</p>
              <p>• Escores T: M=50, DP=10. Valores ≥60 indicam elevação clínica.</p>
              <p>• BRI: Regulação Comportamental | ERI: Regulação Emocional | CRI: Regulação Cognitiva | GEC: Composto Global.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Escores T</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Input type="number" min="20" max="100" value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder="T" className="h-9 mt-1" />
                {scores[f.key] && !isNaN(parseInt(scores[f.key])) && (
                  <Badge className={`mt-1 text-[10px] ${getColor(getBRIEF2Classification(parseInt(scores[f.key])))}`}>
                    {getBRIEF2Classification(parseInt(scores[f.key]))}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">&lt;60: Normal | 60-64: Levemente Elevado | 65-69: Potencialmente Clínico | ≥70: Clinicamente Significativo</div>
      </CardContent>
    </Card>
  );
}
