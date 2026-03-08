import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateBRIEF2Results, getBRIEF2Classification, type BRIEF2Results } from '@/data/neuroTests/brief2';

interface Props {
  patientAge: number;
  onResultsChange: (results: BRIEF2Results | null) => void;
}

const fields = [
  { key: 'inibicao', label: 'Inibição (T)' },
  { key: 'autocontrole', label: 'Autocontrole (T)' },
  { key: 'flexibilidade', label: 'Flexibilidade (T)' },
  { key: 'regulacaoEmocional', label: 'Regulação Emocional (T)' },
  { key: 'iniciativa', label: 'Iniciativa (T)' },
  { key: 'memoriaTrabalho', label: 'Memória de Trabalho (T)' },
  { key: 'planejamento', label: 'Planejamento/Org. (T)' },
  { key: 'monitoramento', label: 'Monitoramento (T)' },
  { key: 'bri', label: 'BRI - Reg. Comportamental (T)' },
  { key: 'eri', label: 'ERI - Reg. Emocional (T)' },
  { key: 'cri', label: 'CRI - Reg. Cognitiva (T)' },
  { key: 'gec', label: 'GEC - Índice Global (T)' },
];

export default function NeuroTestBRIEF2Form({ patientAge, onResultsChange }: Props) {
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
      onResultsChange(calculateBRIEF2Results(parsed as any));
    } else {
      onResultsChange(null);
    }
  }, [scores]);

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c.includes('Levemente')) return 'bg-yellow-500 text-white';
    if (c.includes('Potencialmente')) return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          BRIEF-2 - Inventário de Funções Executivas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fields.map(f => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Input type="number" min="20" max="100" value={scores[f.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder="T" className="h-9" />
              {scores[f.key] && !isNaN(parseInt(scores[f.key])) && (
                <Badge className={`mt-1 text-[10px] ${getColor(getBRIEF2Classification(parseInt(scores[f.key])))}`}>
                  {getBRIEF2Classification(parseInt(scores[f.key]))}
                </Badge>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">&lt;60: Normal | 60-64: Levemente Elevado | 65-69: Potencialmente Clínico | ≥70: Clinicamente Significativo</div>
      </CardContent>
    </Card>
  );
}
