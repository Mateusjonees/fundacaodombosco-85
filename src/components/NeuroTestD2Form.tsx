import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateD2Results, type D2Results } from '@/data/neuroTests/d2';

interface Props {
  patientAge: number;
  onResultsChange: (results: D2Results | null) => void;
}

export default function NeuroTestD2Form({ patientAge, onResultsChange }: Props) {
  const [totalProcessados, setTotalProcessados] = useState<string>('');
  const [acertos, setAcertos] = useState<string>('');
  const [errosE1, setErrosE1] = useState<string>('');
  const [errosE2, setErrosE2] = useState<string>('');

  useEffect(() => {
    const tp = parseInt(totalProcessados);
    const ac = parseInt(acertos);
    const e1 = parseInt(errosE1) || 0;
    const e2 = parseInt(errosE2) || 0;
    if (!isNaN(tp) && tp > 0 && !isNaN(ac)) {
      const results = calculateD2Results(tp, ac, e1, e2, patientAge);
      onResultsChange(results);
    } else {
      onResultsChange(null);
    }
  }, [totalProcessados, acertos, errosE1, errosE2, patientAge]);

  const getResults = () => {
    const tp = parseInt(totalProcessados);
    const ac = parseInt(acertos);
    if (isNaN(tp) || isNaN(ac)) return null;
    return calculateD2Results(tp, ac, parseInt(errosE1) || 0, parseInt(errosE2) || 0, patientAge);
  };

  const results = getResults();

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          D2 - Atenção Concentrada - {patientAge} anos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Total Processados</Label>
            <Input type="number" min="0" value={totalProcessados} onChange={(e) => setTotalProcessados(e.target.value)} placeholder="Ex: 400" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Acertos (d com traços)</Label>
            <Input type="number" min="0" value={acertos} onChange={(e) => setAcertos(e.target.value)} placeholder="Ex: 160" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">E1 - Erros Comissão</Label>
            <Input type="number" min="0" value={errosE1} onChange={(e) => setErrosE1(e.target.value)} placeholder="0" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">E2 - Erros Omissão</Label>
            <Input type="number" min="0" value={errosE2} onChange={(e) => setErrosE2(e.target.value)} placeholder="0" className="h-9" />
          </div>
        </div>
        {results && (
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">RL:</span> <strong>{results.calculatedScores.rl}</strong>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">IC:</span> <strong>{results.calculatedScores.ic}</strong>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">E%:</span> <strong>{results.calculatedScores.erroPerc}%</strong>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Total Erros:</span> <strong>{results.calculatedScores.totalErros}</strong>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">RL: P{results.percentiles.rl}</Badge>
              <Badge className={
                results.percentiles.rl <= 10 ? 'bg-destructive text-destructive-foreground' :
                results.percentiles.rl <= 25 ? 'bg-orange-500 text-white' :
                results.percentiles.rl >= 75 ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground'
              }>{results.classifications.rl}</Badge>
              <Badge variant="outline">IC: P{results.percentiles.ic}</Badge>
              <Badge className={
                results.percentiles.ic <= 10 ? 'bg-destructive text-destructive-foreground' :
                results.percentiles.ic <= 25 ? 'bg-orange-500 text-white' :
                results.percentiles.ic >= 75 ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground'
              }>{results.classifications.ic}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
