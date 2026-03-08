import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateVinelandResults, getVinelandClassification, type VinelandResults } from '@/data/neuroTests/vineland';

interface Props {
  patientAge: number;
  onResultsChange: (results: VinelandResults | null) => void;
  onRemove?: () => void;
}

const fields = [
  { key: 'comunicacao', label: 'Comunicação' },
  { key: 'vidaDiaria', label: 'Vida Diária' },
  { key: 'socializacao', label: 'Socialização' },
  { key: 'habMotoras', label: 'Hab. Motoras' },
  { key: 'compostoGeral', label: 'CAG (Composto Geral)' },
];

export default function NeuroTestVinelandForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const parsed: Record<string, number> = {};
    let allValid = true;
    for (const f of fields) {
      const v = parseInt(scores[f.key] || '');
      if (isNaN(v) || v < 20 || v > 160) { allValid = false; break; }
      parsed[f.key] = v;
    }
    if (allValid) {
      onResultsChange(calculateVinelandResults(parsed as any));
    } else {
      onResultsChange(null);
    }
  }, [scores]);

  const getColor = (c: string) => {
    if (c === 'Alto' || c === 'Moderadamente Alto') return 'bg-green-600 text-white';
    if (c === 'Adequado') return 'bg-blue-600 text-white';
    if (c === 'Moderadamente Baixo') return 'bg-yellow-500 text-white';
    if (c === 'Baixo') return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Vineland-3 - Comportamento Adaptativo
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avalia comportamento adaptativo em 4 domínios • 0-90 anos</p>
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
              <p>• Entrevista semiestruturada com cuidador/responsável (20-60 min).</p>
              <p>• Insira os escores padrão compostos já calculados (M=100, DP=15).</p>
              <p>• Domínios: Comunicação, Vida Diária, Socialização, Hab. Motoras.</p>
              <p>• CAG = Composto Adaptativo Geral (índice global).</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Escores Padrão</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Input type="number" min="20" max="160" value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder="EP" className="h-9 mt-1" />
                {scores[f.key] && !isNaN(parseInt(scores[f.key])) && (
                  <Badge className={`mt-1 text-[10px] ${getColor(getVinelandClassification(parseInt(scores[f.key])))}`}>
                    {getVinelandClassification(parseInt(scores[f.key]))}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">≥130: Alto | 115-129: Mod. Alto | 86-114: Adequado | 71-85: Mod. Baixo | 55-70: Baixo | &lt;55: Muito Baixo</div>
      </CardContent>
    </Card>
  );
}
