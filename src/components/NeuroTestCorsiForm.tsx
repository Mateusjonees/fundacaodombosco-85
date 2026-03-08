import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateCorsiResults, type CorsiResults } from '@/data/neuroTests/corsi';

interface Props {
  patientAge: number;
  onResultsChange: (results: CorsiResults | null) => void;
}

export default function NeuroTestCorsiForm({ patientAge, onResultsChange }: Props) {
  const [spanDireto, setSpanDireto] = useState<string>('');
  const [spanInverso, setSpanInverso] = useState<string>('');

  useEffect(() => {
    const sd = parseInt(spanDireto);
    const si = parseInt(spanInverso);
    if (!isNaN(sd) && sd >= 1 && sd <= 9 && !isNaN(si) && si >= 1 && si <= 9) {
      onResultsChange(calculateCorsiResults(sd, si));
    } else {
      onResultsChange(null);
    }
  }, [spanDireto, spanInverso]);

  const getColor = (c: string) => {
    if (c === 'Superior' || c === 'Média Superior') return 'bg-green-600 text-white';
    if (c === 'Média') return 'bg-blue-600 text-white';
    if (c === 'Média Inferior') return 'bg-yellow-500 text-white';
    if (c === 'Limítrofe') return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Cubos de Corsi - Memória Visuoespacial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Span Direto (1-9)</Label>
            <Input type="number" min="1" max="9" value={spanDireto} onChange={(e) => setSpanDireto(e.target.value)} placeholder="1-9" className="h-9" />
            {spanDireto && !isNaN(parseInt(spanDireto)) && (
              <Badge className={`mt-1 text-[10px] ${getColor(calculateCorsiResults(parseInt(spanDireto), 1).classifications.spanDireto)}`}>
                {calculateCorsiResults(parseInt(spanDireto), 1).classifications.spanDireto}
              </Badge>
            )}
          </div>
          <div>
            <Label className="text-xs">Span Inverso (1-9)</Label>
            <Input type="number" min="1" max="9" value={spanInverso} onChange={(e) => setSpanInverso(e.target.value)} placeholder="1-9" className="h-9" />
            {spanInverso && !isNaN(parseInt(spanInverso)) && (
              <Badge className={`mt-1 text-[10px] ${getColor(calculateCorsiResults(1, parseInt(spanInverso)).classifications.spanInverso)}`}>
                {calculateCorsiResults(1, parseInt(spanInverso)).classifications.spanInverso}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">≥7: Superior | 6: Média Superior | 5: Média | 4: Média Inferior | 3: Limítrofe | ≤2: Deficitário</div>
      </CardContent>
    </Card>
  );
}
