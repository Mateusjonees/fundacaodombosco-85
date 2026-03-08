import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateConnersResults, getConnersClassification, type ConnersResults } from '@/data/neuroTests/conners';

interface Props {
  patientAge: number;
  onResultsChange: (results: ConnersResults | null) => void;
}

const fields = [
  { key: 'desatencao', label: 'Desatenção (T)' },
  { key: 'hiperatividade', label: 'Hiper./Impulsividade (T)' },
  { key: 'aprendizagem', label: 'Prob. Aprendizagem (T)' },
  { key: 'funcoesExecutivas', label: 'Funções Executivas (T)' },
  { key: 'agressividade', label: 'Agressividade (T)' },
  { key: 'relacoesPares', label: 'Relações com Pares (T)' },
  { key: 'indiceTDAH', label: 'Índice TDAH (T)' },
];

export default function NeuroTestConnersForm({ patientAge, onResultsChange }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});

  useEffect(() => {
    const parsed: Record<string, number> = {};
    let allValid = true;
    for (const f of fields) {
      const v = parseInt(scores[f.key] || '');
      if (isNaN(v) || v < 20 || v > 100) { allValid = false; break; }
      parsed[f.key] = v;
    }
    if (allValid) {
      onResultsChange(calculateConnersResults(parsed as any));
    } else {
      onResultsChange(null);
    }
  }, [scores]);

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c.includes('Levemente')) return 'bg-yellow-500 text-white';
    if (c.includes('Moderadamente')) return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Conners 3 - Avaliação TDAH
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fields.map(f => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Input type="number" min="20" max="100" value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder="T" className="h-9" />
              {scores[f.key] && !isNaN(parseInt(scores[f.key])) && (
                <Badge className={`mt-1 text-[10px] ${getColor(getConnersClassification(parseInt(scores[f.key])))}`}>
                  {getConnersClassification(parseInt(scores[f.key]))}
                </Badge>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">&lt;60: Normal | 60-64: Levemente Atípico | 65-69: Moderadamente | ≥70: Marcadamente Atípico</div>
      </CardContent>
    </Card>
  );
}
