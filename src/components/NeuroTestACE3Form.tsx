import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateACE3Results, type ACE3Results } from '@/data/neuroTests/ace3';

interface Props {
  patientAge: number;
  onResultsChange: (results: ACE3Results | null) => void;
  onRemove?: () => void;
}

const domains = [
  { key: 'atencao', label: 'Atenção', max: 18 },
  { key: 'memoria', label: 'Memória', max: 26 },
  { key: 'fluencia', label: 'Fluência', max: 14 },
  { key: 'linguagem', label: 'Linguagem', max: 26 },
  { key: 'visuoespacial', label: 'Visuoespacial', max: 16 },
];

export default function NeuroTestACE3Form({ patientAge, onResultsChange, onRemove }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [educationYears, setEducationYears] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const edu = parseInt(educationYears);
    if (isNaN(edu) || edu < 0) { onResultsChange(null); return; }
    const parsed: Record<string, number> = { educationYears: edu };
    for (const d of domains) {
      const v = parseInt(scores[d.key] || '');
      if (isNaN(v) || v < 0 || v > d.max) { onResultsChange(null); return; }
      parsed[d.key] = v;
    }
    onResultsChange(calculateACE3Results(parsed as any));
  }, [scores, educationYears]);

  const total = domains.reduce((s, d) => s + (parseInt(scores[d.key] || '0') || 0), 0);

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c.includes('Possível')) return 'bg-yellow-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            ACE-III - Addenbrooke's Cognitive Examination
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avaliação cognitiva breve de 5 domínios • Pontuação total: 100</p>
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
              <p>• Aplicação individual, duração de 15-20 minutos.</p>
              <p>• Avalia: Atenção (18), Memória (26), Fluência (14), Linguagem (26), Visuoespacial (16).</p>
              <p>• Pontos de corte ajustados por escolaridade.</p>
              <p>• Pontuação total: 0-100. Quanto maior, melhor o desempenho.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Escolaridade</Label>
          <div>
            <Label className="text-xs">Anos de Escolaridade</Label>
            <Input type="number" min="0" max="30" value={educationYears} onChange={(e) => setEducationYears(e.target.value)} placeholder="Ex: 8" className="h-9 max-w-[200px] mt-1" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuações por Domínio</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {domains.map(d => (
              <div key={d.key}>
                <Label className="text-xs">{d.label} (0-{d.max})</Label>
                <Input type="number" min="0" max={d.max} value={scores[d.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [d.key]: e.target.value }))} className="h-9 mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Total: {total}/100</Badge>
            {!isNaN(parseInt(educationYears)) && parseInt(educationYears) >= 0 && (() => {
              const result = calculateACE3Results({ ...Object.fromEntries(domains.map(d => [d.key, parseInt(scores[d.key] || '0') || 0])), educationYears: parseInt(educationYears) } as any);
              return result ? <Badge className={getColor(result.severity)}>{result.severity}</Badge> : null;
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
