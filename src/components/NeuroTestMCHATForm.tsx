import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateMCHATResults, type MCHATResults } from '@/data/neuroTests/mchat';

interface Props {
  patientAge: number;
  onResultsChange: (results: MCHATResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestMCHATForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [totalScore, setTotalScore] = useState<string>('');
  const [criticalItems, setCriticalItems] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const score = parseInt(totalScore);
    if (!isNaN(score) && score >= 0 && score <= 20) {
      const critical = parseInt(criticalItems) || 0;
      onResultsChange(calculateMCHATResults(score, critical));
    } else {
      onResultsChange(null);
    }
  }, [totalScore, criticalItems]);

  const score = parseInt(totalScore);
  const isValid = !isNaN(score) && score >= 0 && score <= 20;

  const getRiskColor = (classification: string) => {
    switch (classification) {
      case 'Baixo Risco': return 'bg-green-600 text-white';
      case 'Risco Médio': return 'bg-orange-500 text-white';
      case 'Alto Risco': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            M-CHAT-R/F - Rastreamento TEA
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Rastreamento de Transtorno do Espectro Autista • 16-30 meses</p>
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
              <p>• Questionário de 20 itens respondidos pelos pais (Sim/Não).</p>
              <p>• Contar respostas que indicam risco (respostas atípicas).</p>
              <p>• Itens críticos: 2, 5, 9, 11, 14, 15, 17, 18 - maior peso para TEA.</p>
              <p>• Risco Médio: aplicar entrevista de seguimento (Follow-up).</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuação</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Total de Respostas de Risco (0-20)</Label>
              <Input type="number" min="0" max="20" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} placeholder="0-20" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Itens Críticos Positivos (opcional)</Label>
              <Input type="number" min="0" max="20" value={criticalItems} onChange={(e) => setCriticalItems(e.target.value)} placeholder="0" className="h-9 mt-1" />
            </div>
          </div>
        </div>

        {isValid && (() => {
          const results = calculateMCHATResults(score);
          return (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{score}/20</Badge>
                <Badge className={getRiskColor(results.riskLevel)}>{results.riskLevel}</Badge>
              </div>
            </div>
          );
        })()}

        <div className="text-xs text-muted-foreground">0-2: Baixo Risco | 3-7: Risco Médio | 8-20: Alto Risco</div>
      </CardContent>
    </Card>
  );
}
