import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateSDQResults, getSDQClassification, type SDQResults } from '@/data/neuroTests/sdq';

interface Props {
  patientAge: number;
  onResultsChange: (results: SDQResults | null) => void;
}

const fields = [
  { key: 'sintomasEmocionais', label: 'Sintomas Emocionais', max: 10 },
  { key: 'problemasConduta', label: 'Problemas de Conduta', max: 10 },
  { key: 'hiperatividade', label: 'Hiperatividade', max: 10 },
  { key: 'problemasPares', label: 'Problemas com Pares', max: 10 },
  { key: 'proSocial', label: 'Comportamento Pró-social', max: 10 },
];

export default function NeuroTestSDQForm({ patientAge, onResultsChange }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});

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
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          SDQ - Questionário de Capacidades e Dificuldades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fields.map(f => (
            <div key={f.key}>
              <Label className="text-xs">{f.label} (0-{f.max})</Label>
              <Input type="number" min="0" max={f.max} value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} className="h-9" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Total Dificuldades: {totalDif}/40</Badge>
          <Badge className={getColor(getSDQClassification('totalDificuldades', totalDif))}>
            {getSDQClassification('totalDificuldades', totalDif)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
