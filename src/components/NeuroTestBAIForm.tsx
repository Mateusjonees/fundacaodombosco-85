import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateBAIResults, type BAIResults } from '@/data/neuroTests/bai';

interface Props {
  patientAge: number;
  onResultsChange: (results: BAIResults | null) => void;
}

export default function NeuroTestBAIForm({ patientAge, onResultsChange }: Props) {
  const [totalScore, setTotalScore] = useState<string>('');

  useEffect(() => {
    const score = parseInt(totalScore);
    if (!isNaN(score) && score >= 0 && score <= 63) {
      onResultsChange(calculateBAIResults(score));
    } else {
      onResultsChange(null);
    }
  }, [totalScore]);

  const score = parseInt(totalScore);
  const isValid = !isNaN(score) && score >= 0 && score <= 63;

  const getSeverityColor = (classification: string) => {
    switch (classification) {
      case 'Mínimo': return 'bg-green-600 text-white';
      case 'Leve': return 'bg-yellow-500 text-white';
      case 'Moderado': return 'bg-orange-500 text-white';
      case 'Grave': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          BAI - Inventário de Ansiedade de Beck
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Escore Total (soma dos 21 itens, 0-63)</Label>
          <Input
            type="number"
            min="0"
            max="63"
            value={totalScore}
            onChange={(e) => setTotalScore(e.target.value)}
            placeholder="0-63"
            className="h-9 max-w-[200px]"
          />
        </div>
        {isValid && (() => {
          const results = calculateBAIResults(score);
          return (
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{score}/63</Badge>
              <Badge className={getSeverityColor(results.severity)}>
                {results.severity}
              </Badge>
            </div>
          );
        })()}
        <div className="text-xs text-muted-foreground mt-1">
          0-10: Mínimo | 11-19: Leve | 20-30: Moderado | 31-63: Grave
        </div>
      </CardContent>
    </Card>
  );
}
