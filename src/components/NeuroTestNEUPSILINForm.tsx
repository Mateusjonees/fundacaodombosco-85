import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateNEUPSILINResults, getNEUPSILINClassification, type NEUPSILINResults } from '@/data/neuroTests/neupsilin';

interface Props {
  patientAge: number;
  onResultsChange: (results: NEUPSILINResults | null) => void;
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

export default function NeuroTestNEUPSILINForm({ patientAge, onResultsChange }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});

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
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          NEUPSILIN - Avaliação Neuropsicológica Breve
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">Insira os escores Z de cada domínio</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {fields.map(f => (
            <div key={f.key}>
              <Label className="text-xs">{f.label} (Z)</Label>
              <Input type="number" step="0.1" value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder="Z" className="h-9" />
              {scores[f.key] && !isNaN(parseFloat(scores[f.key])) && (
                <Badge className={`mt-1 text-[10px] ${getColor(getNEUPSILINClassification(parseFloat(scores[f.key])))}`}>
                  {getNEUPSILINClassification(parseFloat(scores[f.key]))}
                </Badge>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">Z≥1: Acima da Média | Z -1 a 1: Média | Z -1 a -1.5: Limítrofe | Z -1.5 a -2: Deficitário | Z&lt;-2: Muito Deficitário</div>
      </CardContent>
    </Card>
  );
}
