import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateMoCAResults, type MoCAResults } from '@/data/neuroTests/moca';

interface Props {
  patientAge: number;
  onResultsChange: (results: MoCAResults | null) => void;
}

export default function NeuroTestMoCAForm({ patientAge, onResultsChange }: Props) {
  const [totalScore, setTotalScore] = useState<string>('');
  const [educationYears, setEducationYears] = useState<string>('');

  useEffect(() => {
    const score = parseInt(totalScore);
    const edu = parseInt(educationYears);
    if (!isNaN(score) && score >= 0 && score <= 30 && !isNaN(edu) && edu >= 0) {
      onResultsChange(calculateMoCAResults(score, edu));
    } else {
      onResultsChange(null);
    }
  }, [totalScore, educationYears]);

  const score = parseInt(totalScore);
  const edu = parseInt(educationYears);
  const isValid = !isNaN(score) && score >= 0 && score <= 30 && !isNaN(edu) && edu >= 0;

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c.includes('Leve')) return 'bg-yellow-500 text-white';
    if (c.includes('Moderado')) return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          MoCA - Montreal Cognitive Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Escore Total (0-30)</Label>
            <Input type="number" min="0" max="30" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} placeholder="0-30" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Anos de Escolaridade</Label>
            <Input type="number" min="0" max="30" value={educationYears} onChange={(e) => setEducationYears(e.target.value)} placeholder="Ex: 12" className="h-9" />
          </div>
        </div>
        {isValid && (() => {
          const results = calculateMoCAResults(score, edu);
          return (
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{score}/30</Badge>
              {edu <= 12 && <Badge variant="outline">Ajustado: {results.calculatedScores.adjustedScore}/30</Badge>}
              <Badge className={getColor(results.severity)}>{results.severity}</Badge>
            </div>
          );
        })()}
        <div className="text-xs text-muted-foreground">≥26: Normal | 22-25: DCL | 17-21: Moderado | &lt;17: Grave. +1 ponto se escolaridade ≤12 anos.</div>
      </CardContent>
    </Card>
  );
}
