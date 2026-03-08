import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateRavenResults, type RavenResults } from '@/data/neuroTests/raven';

interface Props {
  patientAge: number;
  onResultsChange: (results: RavenResults | null) => void;
}

export default function NeuroTestRavenForm({ patientAge, onResultsChange }: Props) {
  const isColorida = patientAge <= 11;
  const [serieA, setSerieA] = useState<string>('');
  const [serieAb, setSerieAb] = useState<string>('');
  const [serieB, setSerieB] = useState<string>('');
  const [serieC, setSerieC] = useState<string>('');
  const [serieD, setSerieD] = useState<string>('');
  const [serieE, setSerieE] = useState<string>('');

  useEffect(() => {
    const a = parseInt(serieA) || 0;
    const ab = parseInt(serieAb) || 0;
    const b = parseInt(serieB) || 0;
    const c = parseInt(serieC) || 0;
    const d = parseInt(serieD) || 0;
    const e = parseInt(serieE) || 0;

    const total = isColorida ? a + ab + b : a + b + c + d + e;

    if (total > 0) {
      const results = calculateRavenResults(total, patientAge, {
        serieA: a, serieAb: isColorida ? ab : undefined, serieB: b,
        serieC: !isColorida ? c : undefined, serieD: !isColorida ? d : undefined, serieE: !isColorida ? e : undefined,
        total
      });
      onResultsChange(results);
    } else {
      onResultsChange(null);
    }
  }, [serieA, serieAb, serieB, serieC, serieD, serieE, patientAge]);

  const getTotal = () => {
    const a = parseInt(serieA) || 0;
    const ab = parseInt(serieAb) || 0;
    const b = parseInt(serieB) || 0;
    const c = parseInt(serieC) || 0;
    const d = parseInt(serieD) || 0;
    const e = parseInt(serieE) || 0;
    return isColorida ? a + ab + b : a + b + c + d + e;
  };

  const total = getTotal();
  const results = total > 0 ? calculateRavenResults(total, patientAge, { serieA: parseInt(serieA) || 0, serieB: parseInt(serieB) || 0, total }) : null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Matrizes de Raven ({isColorida ? 'Colorida' : 'Geral'}) - {patientAge} anos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`grid gap-3 ${isColorida ? 'grid-cols-3' : 'grid-cols-5'}`}>
          <div>
            <Label className="text-xs">Série A</Label>
            <Input type="number" min="0" max="12" value={serieA} onChange={(e) => setSerieA(e.target.value)} placeholder="0-12" className="h-9" />
          </div>
          {isColorida && (
            <div>
              <Label className="text-xs">Série Ab</Label>
              <Input type="number" min="0" max="12" value={serieAb} onChange={(e) => setSerieAb(e.target.value)} placeholder="0-12" className="h-9" />
            </div>
          )}
          <div>
            <Label className="text-xs">Série B</Label>
            <Input type="number" min="0" max="12" value={serieB} onChange={(e) => setSerieB(e.target.value)} placeholder="0-12" className="h-9" />
          </div>
          {!isColorida && (
            <>
              <div>
                <Label className="text-xs">Série C</Label>
                <Input type="number" min="0" max="12" value={serieC} onChange={(e) => setSerieC(e.target.value)} placeholder="0-12" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Série D</Label>
                <Input type="number" min="0" max="12" value={serieD} onChange={(e) => setSerieD(e.target.value)} placeholder="0-12" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Série E</Label>
                <Input type="number" min="0" max="12" value={serieE} onChange={(e) => setSerieE(e.target.value)} placeholder="0-12" className="h-9" />
              </div>
            </>
          )}
        </div>
        {results && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">Total: {total}</Badge>
            <Badge variant="outline">P{results.percentiles.total}</Badge>
            <Badge className={
              results.percentiles.total <= 10 ? 'bg-destructive text-destructive-foreground' :
              results.percentiles.total <= 25 ? 'bg-orange-500 text-white' :
              results.percentiles.total >= 75 ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground'
            }>
              {results.classifications.total}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
