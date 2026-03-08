import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateCBCLResults, getCBCLClassification, type CBCLResults } from '@/data/neuroTests/cbcl';

interface Props {
  patientAge: number;
  onResultsChange: (results: CBCLResults | null) => void;
}

const fields = [
  { key: 'internalizacao', label: 'Internalização (T)' },
  { key: 'externalizacao', label: 'Externalização (T)' },
  { key: 'totalProblemas', label: 'Total de Problemas (T)' },
];

export default function NeuroTestCBCLForm({ patientAge, onResultsChange }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});

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
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          CBCL - Child Behavior Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {fields.map(f => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Input type="number" min="20" max="100" value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder="T" className="h-9" />
              {scores[f.key] && !isNaN(parseInt(scores[f.key])) && (
                <Badge className={`mt-1 text-[10px] ${getColor(getCBCLClassification(parseInt(scores[f.key])))}`}>
                  {getCBCLClassification(parseInt(scores[f.key]))}
                </Badge>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">&lt;60: Normal | 60-63: Limítrofe | ≥64: Clínico</div>
      </CardContent>
    </Card>
  );
}
