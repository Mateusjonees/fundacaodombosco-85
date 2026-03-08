import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateToLResults, type ToLResults } from '@/data/neuroTests/tol';

interface Props {
  patientAge: number;
  onResultsChange: (results: ToLResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestToLForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [totalAcertos, setTotalAcertos] = useState<string>('');
  const [tempoTotal, setTempoTotal] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);

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
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Torre de Londres (ToL)
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avalia planejamento e resolução de problemas • {patientAge} anos</p>
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
              <p>• 12 problemas com dificuldade crescente (2 a 5 movimentos).</p>
              <p>• O paciente deve replicar a configuração-alvo no menor número de movimentos.</p>
              <p>• Acerto = resolver no número mínimo de movimentos na 1ª tentativa.</p>
              <p>• Opcional: registrar o tempo total de execução (segundos).</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuação</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Total de Acertos (0-12)</Label>
              <Input type="number" min="0" max="12" value={totalAcertos} onChange={(e) => setTotalAcertos(e.target.value)} placeholder="0-12" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Tempo Total (seg, opcional)</Label>
              <Input type="number" min="0" value={tempoTotal} onChange={(e) => setTempoTotal(e.target.value)} placeholder="Segundos" className="h-9 mt-1" />
            </div>
          </div>
        </div>

        {totalAcertos && !isNaN(parseInt(totalAcertos)) && (() => {
          const results = calculateToLResults(parseInt(totalAcertos), patientAge);
          return (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">P{results.percentiles.totalAcertos}</Badge>
                <Badge className={
                  results.percentiles.totalAcertos <= 10 ? 'bg-destructive text-destructive-foreground' :
                  results.percentiles.totalAcertos <= 25 ? 'bg-orange-500 text-white' :
                  results.percentiles.totalAcertos >= 75 ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground'
                }>
                  {results.classifications.totalAcertos}
                </Badge>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
