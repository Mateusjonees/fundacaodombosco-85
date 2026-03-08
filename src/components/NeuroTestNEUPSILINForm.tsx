import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateNEUPSILINResults, getNEUPSILINClassification, type NEUPSILINResults } from '@/data/neuroTests/neupsilin';

interface Props {
  patientAge: number;
  onResultsChange: (results: NEUPSILINResults | null) => void;
  onRemove?: () => void;
}

const fields = [
  { key: 'orientacao', label: 'Orientação' },
  { key: 'atencao', label: 'Atenção' },
  { key: 'percepcao', label: 'Percepção' },
  { key: 'memoria', label: 'Memória' },
  { key: 'aritmetica', label: 'Hab. Aritméticas' },
  { key: 'linguagem', label: 'Linguagem' },
  { key: 'praxias', label: 'Praxias' },
  { key: 'funcoesExecutivas', label: 'Funções Executivas' },
];

export default function NeuroTestNEUPSILINForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const parsed: Record<string, number> = {};
    let hasAny = false;
    for (const f of fields) {
      const v = parseFloat(scores[f.key] || '');
      if (isNaN(v)) continue;
      parsed[f.key] = v;
      hasAny = true;
    }
    if (hasAny && Object.keys(parsed).length === fields.length) {
      onResultsChange(calculateNEUPSILINResults(parsed));
    } else {
      onResultsChange(null);
    }
  }, [scores]);

  const getColor = (c: string) => {
    if (c === 'Acima da Média') return 'bg-green-600 text-white';
    if (c === 'Média') return 'bg-blue-600 text-white';
    if (c === 'Limítrofe') return 'bg-yellow-500 text-white';
    if (c === 'Deficitário') return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            NEUPSILIN - Avaliação Neuropsicológica Breve
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avaliação breve de 8 funções neuropsicológicas • 12-90 anos</p>
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
              <p>• Instrumento de avaliação neuropsicológica breve (30-40 min).</p>
              <p>• Avalia: Orientação, Atenção, Percepção, Memória, Aritmética, Linguagem, Praxias e Funções Executivas.</p>
              <p>• Insira os escores Z de cada domínio conforme calculados pelo manual.</p>
              <p>• Escores Z negativos indicam desempenho abaixo da média normativa.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Escores Z por Domínio</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label} (Z)</Label>
                <Input type="number" step="0.1" value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder="Z" className="h-9 mt-1" />
                {scores[f.key] && !isNaN(parseFloat(scores[f.key])) && (
                  <Badge className={`mt-1 text-[10px] ${getColor(getNEUPSILINClassification(parseFloat(scores[f.key])))}`}>
                    {getNEUPSILINClassification(parseFloat(scores[f.key]))}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">Z≥1: Acima da Média | Z -1 a 1: Média | Z -1 a -1.5: Limítrofe | Z -1.5 a -2: Deficitário | Z&lt;-2: Muito Deficitário</div>
      </CardContent>
    </Card>
  );
}
