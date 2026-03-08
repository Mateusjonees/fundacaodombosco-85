import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateVinelandResults, getVinelandClassification, type VinelandResults } from '@/data/neuroTests/vineland';

interface Props {
  patientAge: number;
  onResultsChange: (results: VinelandResults | null) => void;
}

const fields = [
  { key: 'comunicacao', label: 'Comunicação' },
  { key: 'vidaDiaria', label: 'Vida Diária' },
  { key: 'socializacao', label: 'Socialização' },
  { key: 'habMotoras', label: 'Hab. Motoras' },
  { key: 'compostoGeral', label: 'CAG (Composto Geral)' },
];

export default function NeuroTestVinelandForm({ patientAge, onResultsChange }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});

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
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Vineland-3 - Comportamento Adaptativo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">Insira os escores padrão de cada domínio (M=100, DP=15)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fields.map(f => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Input type="number" min="20" max="160" value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder="EP" className="h-9" />
              {scores[f.key] && !isNaN(parseInt(scores[f.key])) && (
                <Badge className={`mt-1 text-[10px] ${getColor(getVinelandClassification(parseInt(scores[f.key])))}`}>
                  {getVinelandClassification(parseInt(scores[f.key]))}
                </Badge>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">≥130: Alto | 115-129: Mod. Alto | 86-114: Adequado | 71-85: Mod. Baixo | 55-70: Baixo | &lt;55: Muito Baixo</div>
      </CardContent>
    </Card>
  );
}
