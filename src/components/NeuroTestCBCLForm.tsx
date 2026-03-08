import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateCBCLResults, getCBCLClassification, type CBCLResults } from '@/data/neuroTests/cbcl';

interface Props {
  patientAge: number;
  onResultsChange: (results: CBCLResults | null) => void;
  onRemove?: () => void;
}

const fields = [
  { key: 'internalizacao', label: 'Internalização (T)' },
  { key: 'externalizacao', label: 'Externalização (T)' },
  { key: 'totalProblemas', label: 'Total de Problemas (T)' },
];

export default function NeuroTestCBCLForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const parsed: Record<string, number> = {};
    for (const f of fields) {
      const v = parseInt(scores[f.key] || '');
      if (isNaN(v) || v < 20 || v > 100) { onResultsChange(null); return; }
      parsed[f.key] = v;
    }
    onResultsChange(calculateCBCLResults(parsed as any));
  }, [scores]);

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c === 'Limítrofe') return 'bg-yellow-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            CBCL - Child Behavior Checklist
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avalia problemas comportamentais e emocionais • 1½-18 anos</p>
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
              <p>• Questionário preenchido por pais/responsáveis.</p>
              <p>• Insira os escores T já calculados para cada escala.</p>
              <p>• Internalização: problemas emocionais. Externalização: problemas comportamentais.</p>
              <p>• T &lt;60: Normal | T 60-63: Limítrofe | T ≥64: Clínico.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Escores T</Label>
          <div className="grid grid-cols-3 gap-2">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Input type="number" min="20" max="100" value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder="T" className="h-9 mt-1" />
                {scores[f.key] && !isNaN(parseInt(scores[f.key])) && (
                  <Badge className={`mt-1 text-[10px] ${getColor(getCBCLClassification(parseInt(scores[f.key])))}`}>
                    {getCBCLClassification(parseInt(scores[f.key]))}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">&lt;60: Normal | 60-63: Limítrofe | ≥64: Clínico</div>
      </CardContent>
    </Card>
  );
}
