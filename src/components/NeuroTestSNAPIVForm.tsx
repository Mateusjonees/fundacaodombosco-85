import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateSNAPIVResults, type SNAPIVResults } from '@/data/neuroTests/snapiv';

interface Props {
  patientAge: number;
  onResultsChange: (results: SNAPIVResults | null) => void;
}

export default function NeuroTestSNAPIVForm({ patientAge, onResultsChange }: Props) {
  const [desatencaoTotal, setDesatencaoTotal] = useState<string>('');
  const [hiperatividadeTotal, setHiperatividadeTotal] = useState<string>('');
  const [todTotal, setTodTotal] = useState<string>('');

  useEffect(() => {
    const d = parseFloat(desatencaoTotal);
    const h = parseFloat(hiperatividadeTotal);
    const t = parseFloat(todTotal);
    if (!isNaN(d) && !isNaN(h) && !isNaN(t)) {
      // Calcular médias: desatenção 9 itens, hiperatividade 9 itens, TOD 8 itens
      const dMedia = d / 9;
      const hMedia = h / 9;
      const tMedia = t / 8;
      onResultsChange(calculateSNAPIVResults(dMedia, hMedia, tMedia));
    } else {
      onResultsChange(null);
    }
  }, [desatencaoTotal, hiperatividadeTotal, todTotal]);

  const getIndicativeColor = (classification: string) => {
    return classification === 'Indicativo' ? 'bg-destructive text-destructive-foreground' : 'bg-green-600 text-white';
  };

  const getResults = () => {
    const d = parseFloat(desatencaoTotal);
    const h = parseFloat(hiperatividadeTotal);
    const t = parseFloat(todTotal);
    if (isNaN(d) || isNaN(h) || isNaN(t)) return null;
    return calculateSNAPIVResults(d / 9, h / 9, t / 8);
  };

  const results = getResults();

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          SNAP-IV - Rastreamento TDAH - {patientAge} anos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Soma Desatenção (itens 1-9)</Label>
            <Input type="number" min="0" max="27" value={desatencaoTotal} onChange={(e) => setDesatencaoTotal(e.target.value)} placeholder="0-27" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Soma Hiperatividade (itens 10-18)</Label>
            <Input type="number" min="0" max="27" value={hiperatividadeTotal} onChange={(e) => setHiperatividadeTotal(e.target.value)} placeholder="0-27" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Soma TOD (itens 19-26)</Label>
            <Input type="number" min="0" max="24" value={todTotal} onChange={(e) => setTodTotal(e.target.value)} placeholder="0-24" className="h-9" />
          </div>
        </div>
        {results && (
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <span className="text-muted-foreground">Média: </span>
                <strong>{results.rawScores.desatencao.toFixed(2)}</strong>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground">Média: </span>
                <strong>{results.rawScores.hiperatividade.toFixed(2)}</strong>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground">Média: </span>
                <strong>{results.rawScores.tod.toFixed(2)}</strong>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={getIndicativeColor(results.classifications.desatencao)}>
                Desatenção: {results.classifications.desatencao}
              </Badge>
              <Badge className={getIndicativeColor(results.classifications.hiperatividade)}>
                Hiperativ.: {results.classifications.hiperatividade}
              </Badge>
              <Badge className={getIndicativeColor(results.classifications.tod)}>
                TOD: {results.classifications.tod}
              </Badge>
            </div>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Ponto de corte: média ≥ 1.78 por subescala = Indicativo
        </div>
      </CardContent>
    </Card>
  );
}
