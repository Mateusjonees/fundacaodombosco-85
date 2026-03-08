import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateSNAPIVResults, type SNAPIVResults } from '@/data/neuroTests/snapiv';

interface Props {
  patientAge: number;
  onResultsChange: (results: SNAPIVResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestSNAPIVForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [desatencaoTotal, setDesatencaoTotal] = useState<string>('');
  const [hiperatividadeTotal, setHiperatividadeTotal] = useState<string>('');
  const [todTotal, setTodTotal] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const d = parseFloat(desatencaoTotal);
    const h = parseFloat(hiperatividadeTotal);
    const t = parseFloat(todTotal);
    if (!isNaN(d) && !isNaN(h) && !isNaN(t)) {
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
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            SNAP-IV - Rastreamento TDAH
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Rastreamento de TDAH e TOD • 6-18 anos</p>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline w-full">
              <Info className="h-3 w-3" />
              <span>Instruções de aplicação</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showInstructions ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-2.5 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1">
              <p>• 26 itens com escala de 0 (nem um pouco) a 3 (demais).</p>
              <p>• Desatenção: itens 1-9 | Hiperatividade: itens 10-18 | TOD: itens 19-26.</p>
              <p>• Calcular a média de cada subescala (soma ÷ número de itens).</p>
              <p>• Ponto de corte: média ≥ 1.78 = Indicativo de TDAH/TOD.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Somas por Subescala</Label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Soma Desatenção (1-9)</Label>
              <Input type="number" min="0" max="27" value={desatencaoTotal} onChange={(e) => setDesatencaoTotal(e.target.value)} placeholder="0-27" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Soma Hiperativ. (10-18)</Label>
              <Input type="number" min="0" max="27" value={hiperatividadeTotal} onChange={(e) => setHiperatividadeTotal(e.target.value)} placeholder="0-27" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Soma TOD (19-26)</Label>
              <Input type="number" min="0" max="24" value={todTotal} onChange={(e) => setTodTotal(e.target.value)} placeholder="0-24" className="h-9 mt-1" />
            </div>
          </div>
        </div>

        {results && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
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
              <Badge className={getIndicativeColor(results.classifications.desatencao)}>Desatenção: {results.classifications.desatencao}</Badge>
              <Badge className={getIndicativeColor(results.classifications.hiperatividade)}>Hiperativ.: {results.classifications.hiperatividade}</Badge>
              <Badge className={getIndicativeColor(results.classifications.tod)}>TOD: {results.classifications.tod}</Badge>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">Ponto de corte: média ≥ 1.78 por subescala = Indicativo</div>
      </CardContent>
    </Card>
  );
}
