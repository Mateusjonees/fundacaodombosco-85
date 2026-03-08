import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateCorsiResults, type CorsiResults } from '@/data/neuroTests/corsi';

interface Props {
  patientAge: number;
  onResultsChange: (results: CorsiResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestCorsiForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [spanDireto, setSpanDireto] = useState<string>('');
  const [spanInverso, setSpanInverso] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);

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
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Cubos de Corsi - Memória Visuoespacial
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avalia memória visuoespacial de curto prazo e operacional</p>
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
              <p>• Tabuleiro com 9 cubos em posições irregulares.</p>
              <p>• <strong>Ordem Direta:</strong> o paciente repete a sequência na mesma ordem.</p>
              <p>• <strong>Ordem Inversa:</strong> o paciente repete a sequência na ordem inversa.</p>
              <p>• Span = maior sequência corretamente reproduzida (1-9).</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuação</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Span Direto (1-9)</Label>
              <Input type="number" min="1" max="9" value={spanDireto} onChange={(e) => setSpanDireto(e.target.value)} placeholder="1-9" className="h-9 mt-1" />
              {spanDireto && !isNaN(parseInt(spanDireto)) && (
                <Badge className={`mt-1 text-[10px] ${getColor(calculateCorsiResults(parseInt(spanDireto), 1).classifications.spanDireto)}`}>
                  {calculateCorsiResults(parseInt(spanDireto), 1).classifications.spanDireto}
                </Badge>
              )}
            </div>
            <div>
              <Label className="text-xs">Span Inverso (1-9)</Label>
              <Input type="number" min="1" max="9" value={spanInverso} onChange={(e) => setSpanInverso(e.target.value)} placeholder="1-9" className="h-9 mt-1" />
              {spanInverso && !isNaN(parseInt(spanInverso)) && (
                <Badge className={`mt-1 text-[10px] ${getColor(calculateCorsiResults(1, parseInt(spanInverso)).classifications.spanInverso)}`}>
                  {calculateCorsiResults(1, parseInt(spanInverso)).classifications.spanInverso}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">≥7: Superior | 6: Média Superior | 5: Média | 4: Média Inferior | 3: Limítrofe | ≤2: Deficitário</div>
      </CardContent>
    </Card>
  );
}
