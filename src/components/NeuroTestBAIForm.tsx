import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateBAIResults, type BAIResults } from '@/data/neuroTests/bai';

interface Props {
  patientAge: number;
  onResultsChange: (results: BAIResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestBAIForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [totalScore, setTotalScore] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const score = parseInt(totalScore);
    if (!isNaN(score) && score >= 0 && score <= 63) {
      onResultsChange(calculateBAIResults(score));
    } else {
      onResultsChange(null);
    }
  }, [totalScore]);

  const score = parseInt(totalScore);
  const isValid = !isNaN(score) && score >= 0 && score <= 63;

  const getSeverityColor = (classification: string) => {
    switch (classification) {
      case 'Mínimo': return 'bg-green-600 text-white';
      case 'Leve': return 'bg-yellow-500 text-white';
      case 'Moderado': return 'bg-orange-500 text-white';
      case 'Grave': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            BAI - Inventário de Ansiedade de Beck
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avalia intensidade de sintomas de ansiedade • 17-80 anos</p>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {/* Instruções */}
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
              <p>• O paciente deve indicar quanto cada sintoma o incomodou na <strong>última semana</strong>.</p>
              <p>• São 21 itens, cada um pontuado de 0 (absolutamente não) a 3 (gravemente).</p>
              <p>• Some todos os valores para obter o escore total (0-63).</p>
              <p>• Aplicação individual ou coletiva, duração de 5-10 minutos.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Pontuação */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuação</Label>
          <div>
            <Label className="text-xs sm:text-sm">Escore Total (soma dos 21 itens)</Label>
            <Input
              type="number"
              min="0"
              max="63"
              value={totalScore}
              onChange={(e) => setTotalScore(e.target.value)}
              placeholder="0-63"
              className="h-9 max-w-[200px] mt-1"
            />
          </div>
        </div>

        {/* Resultado */}
        {isValid && (() => {
          const results = calculateBAIResults(score);
          return (
            <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-xs">{score}/63</Badge>
                <Badge className={`${getSeverityColor(results.severity)} text-xs`}>
                  {results.severity}
                </Badge>
              </div>
            </div>
          );
        })()}

        {/* Referência */}
        <div className="grid grid-cols-4 gap-1.5 text-[10px]">
          <div className="p-1.5 bg-green-600/10 rounded text-center">
            <span className="font-medium text-green-700">0-10</span>
            <p className="text-muted-foreground">Mínimo</p>
          </div>
          <div className="p-1.5 bg-yellow-500/10 rounded text-center">
            <span className="font-medium text-yellow-700">11-19</span>
            <p className="text-muted-foreground">Leve</p>
          </div>
          <div className="p-1.5 bg-orange-500/10 rounded text-center">
            <span className="font-medium text-orange-700">20-30</span>
            <p className="text-muted-foreground">Moderado</p>
          </div>
          <div className="p-1.5 bg-red-500/10 rounded text-center">
            <span className="font-medium text-red-700">31-63</span>
            <p className="text-muted-foreground">Grave</p>
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-1">
          <Label className="text-xs">Obs. do Teste</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comportamento durante a aplicação, dificuldades observadas..."
            className="min-h-[50px] resize-none text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
