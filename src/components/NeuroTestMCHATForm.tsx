import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateMCHATResults, type MCHATResults } from '@/data/neuroTests/mchat';

interface Props {
  patientAge: number;
  onResultsChange: (results: MCHATResults | null) => void;
}

export default function NeuroTestMCHATForm({ patientAge, onResultsChange }: Props) {
  const [totalScore, setTotalScore] = useState<string>('');
  const [criticalItems, setCriticalItems] = useState<string>('');

  useEffect(() => {
    const score = parseInt(totalScore);
    if (!isNaN(score) && score >= 0 && score <= 20) {
      const critical = parseInt(criticalItems) || 0;
      onResultsChange(calculateMCHATResults(score, critical));
    } else {
      onResultsChange(null);
    }
  }, [totalScore, criticalItems]);

  const score = parseInt(totalScore);
  const isValid = !isNaN(score) && score >= 0 && score <= 20;

  const getRiskColor = (classification: string) => {
    switch (classification) {
      case 'Baixo Risco': return 'bg-green-600 text-white';
      case 'Risco Médio': return 'bg-orange-500 text-white';
      case 'Alto Risco': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          M-CHAT-R/F - Rastreamento TEA - {patientAge} anos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Total de Respostas de Risco (0-20)</Label>
            <Input
              type="number"
              min="0"
              max="20"
              value={totalScore}
              onChange={(e) => setTotalScore(e.target.value)}
              placeholder="0-20"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Itens Críticos Positivos (opcional)</Label>
            <Input
              type="number"
              min="0"
              max="20"
              value={criticalItems}
              onChange={(e) => setCriticalItems(e.target.value)}
              placeholder="0"
              className="h-9"
            />
          </div>
        </div>
        {isValid && (() => {
          const results = calculateMCHATResults(score);
          return (
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{score}/20</Badge>
              <Badge className={getRiskColor(results.riskLevel)}>
                {results.riskLevel}
              </Badge>
            </div>
          );
        })()}
        <div className="text-xs text-muted-foreground">
          0-2: Baixo Risco | 3-7: Risco Médio | 8-20: Alto Risco
        </div>
      </CardContent>
    </Card>
  );
}
