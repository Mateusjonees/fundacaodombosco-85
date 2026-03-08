import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateToLResults, type ToLResults } from '@/data/neuroTests/tol';

interface Props {
  patientAge: number;
  onResultsChange: (results: ToLResults | null) => void;
}

export default function NeuroTestToLForm({ patientAge, onResultsChange }: Props) {
  const [totalAcertos, setTotalAcertos] = useState<string>('');
  const [tempoTotal, setTempoTotal] = useState<string>('');

  useEffect(() => {
    const acertos = parseInt(totalAcertos);
    if (!isNaN(acertos) && acertos >= 0 && acertos <= 12) {
      const tempo = tempoTotal ? parseInt(tempoTotal) : undefined;
      const results = calculateToLResults(acertos, patientAge, tempo);
      onResultsChange(results);
    } else {
      onResultsChange(null);
    }
  }, [totalAcertos, tempoTotal, patientAge]);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Torre de Londres (ToL) - {patientAge} anos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Total de Acertos (0-12)</Label>
            <Input
              type="number"
              min="0"
              max="12"
              value={totalAcertos}
              onChange={(e) => setTotalAcertos(e.target.value)}
              placeholder="0-12"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Tempo Total (seg, opcional)</Label>
            <Input
              type="number"
              min="0"
              value={tempoTotal}
              onChange={(e) => setTempoTotal(e.target.value)}
              placeholder="Segundos"
              className="h-9"
            />
          </div>
        </div>
        {totalAcertos && !isNaN(parseInt(totalAcertos)) && (() => {
          const results = calculateToLResults(parseInt(totalAcertos), patientAge);
          return (
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">P{results.percentiles.totalAcertos}</Badge>
              <Badge className={
                results.percentiles.totalAcertos <= 10 ? 'bg-destructive text-destructive-foreground' :
                results.percentiles.totalAcertos <= 25 ? 'bg-orange-500 text-white' :
                results.percentiles.totalAcertos >= 75 ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground'
              }>
                {results.classifications.totalAcertos}
              </Badge>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
