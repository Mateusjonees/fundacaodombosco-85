import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateSDQResults, getSDQClassification, type SDQResults } from '@/data/neuroTests/sdq';

interface Props {
  patientAge: number;
  onResultsChange: (results: SDQResults | null) => void;
  onRemove?: () => void;
}

const fields = [
  { key: 'sintomasEmocionais', label: 'Sintomas Emocionais', max: 10 },
  { key: 'problemasConduta', label: 'Problemas de Conduta', max: 10 },
  { key: 'hiperatividade', label: 'Hiperatividade', max: 10 },
  { key: 'problemasPares', label: 'Problemas com Pares', max: 10 },
  { key: 'proSocial', label: 'Comportamento Pró-social', max: 10 },
];

export default function NeuroTestSDQForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const parsed: Record<string, number> = {};
    for (const f of fields) {
      const v = parseInt(scores[f.key] || '');
      if (isNaN(v) || v < 0 || v > f.max) { onResultsChange(null); return; }
      parsed[f.key] = v;
    }
    onResultsChange(calculateSDQResults(parsed as any));
  }, [scores]);

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c === 'Limítrofe') return 'bg-yellow-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  const totalDif = ['sintomasEmocionais', 'problemasConduta', 'hiperatividade', 'problemasPares']
    .reduce((s, k) => s + (parseInt(scores[k] || '0') || 0), 0);

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            SDQ - Questionário de Capacidades e Dificuldades
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Rastreamento de problemas emocionais e comportamentais • 4-17 anos</p>
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
              <p>• 25 itens divididos em 5 subescalas de 5 itens cada.</p>
              <p>• Respostas: Falso (0), Mais ou menos verdadeiro (1), Verdadeiro (2).</p>
              <p>• Total de Dificuldades = soma das 4 primeiras subescalas (sem Pró-social).</p>
              <p>• Respondido por pais, professores ou autoavaliação (11+).</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuação por Subescala</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label} (0-{f.max})</Label>
                <Input type="number" min="0" max={f.max} value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} className="h-9 mt-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Total Dificuldades: {totalDif}/40</Badge>
            <Badge className={getColor(getSDQClassification('totalDificuldades', totalDif))}>
              {getSDQClassification('totalDificuldades', totalDif)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
