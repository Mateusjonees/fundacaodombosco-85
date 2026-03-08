import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateGDSResults, type GDSResults } from '@/data/neuroTests/gds';

interface Props {
  patientAge: number;
  onResultsChange: (results: GDSResults | null) => void;
}

export default function NeuroTestGDSForm({ patientAge, onResultsChange }: Props) {
  const [totalScore, setTotalScore] = useState<string>('');
  const [version, setVersion] = useState<'15' | '30'>('15');

  const maxScore = version === '15' ? 15 : 30;

  useEffect(() => {
    const score = parseInt(totalScore);
    if (!isNaN(score) && score >= 0 && score <= maxScore) {
      onResultsChange(calculateGDSResults(score, version));
    } else {
      onResultsChange(null);
    }
  }, [totalScore, version]);

  const score = parseInt(totalScore);
  const isValid = !isNaN(score) && score >= 0 && score <= maxScore;

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c.includes('Leve')) return 'bg-yellow-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          GDS - Escala de Depressão Geriátrica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Versão</Label>
            <Select value={version} onValueChange={(v) => { setVersion(v as '15' | '30'); setTotalScore(''); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">GDS-15 (15 itens)</SelectItem>
                <SelectItem value="30">GDS-30 (30 itens)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Escore Total (0-{maxScore})</Label>
            <Input type="number" min="0" max={maxScore} value={totalScore} onChange={(e) => setTotalScore(e.target.value)} placeholder={`0-${maxScore}`} className="h-9" />
          </div>
        </div>
        {isValid && (() => {
          const results = calculateGDSResults(score, version);
          return (
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{score}/{maxScore}</Badge>
              <Badge className={getColor(results.severity)}>{results.severity}</Badge>
            </div>
          );
        })()}
        <div className="text-xs text-muted-foreground">
          {version === '15' ? '0-5: Normal | 6-10: Leve | 11-15: Grave' : '0-10: Normal | 11-20: Leve | 21-30: Grave'}
        </div>
      </CardContent>
    </Card>
  );
}
