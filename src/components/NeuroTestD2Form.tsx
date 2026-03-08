import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateD2Results, type D2Results } from '@/data/neuroTests/d2';

interface Props {
  patientAge: number;
  onResultsChange: (results: D2Results | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestD2Form({ patientAge, onResultsChange, onRemove }: Props) {
  const [totalProcessados, setTotalProcessados] = useState<string>('');
  const [acertos, setAcertos] = useState<string>('');
  const [errosE1, setErrosE1] = useState<string>('');
  const [errosE2, setErrosE2] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const tp = parseInt(totalProcessados);
    const ac = parseInt(acertos);
    const e1 = parseInt(errosE1) || 0;
    const e2 = parseInt(errosE2) || 0;
    if (!isNaN(tp) && tp > 0 && !isNaN(ac)) {
      onResultsChange(calculateD2Results(tp, ac, e1, e2, patientAge));
    } else {
      onResultsChange(null);
    }
  }, [totalProcessados, acertos, errosE1, errosE2, patientAge]);

  const getResults = () => {
    const tp = parseInt(totalProcessados);
    const ac = parseInt(acertos);
    if (isNaN(tp) || isNaN(ac)) return null;
    return calculateD2Results(tp, ac, parseInt(errosE1) || 0, parseInt(errosE2) || 0, patientAge);
  };

  const results = getResults();

  const getClassColor = (percentile: number) => {
    if (percentile <= 10) return 'bg-destructive text-destructive-foreground';
    if (percentile <= 25) return 'bg-orange-500 text-white';
    if (percentile >= 75) return 'bg-green-600 text-white';
    return 'bg-primary text-primary-foreground';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            D2 - Atenção Concentrada
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avalia atenção concentrada e velocidade de processamento • {patientAge} anos</p>
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
              <p>• O paciente deve riscar todos os "d" com dois traços (acima, abaixo ou combinados).</p>
              <p>• Cada linha tem 20 segundos. Total: 14 linhas.</p>
              <p>• <strong>E1 (Comissão)</strong>: marcou estímulos errados (p, d com 1 ou 3 traços).</p>
              <p>• <strong>E2 (Omissão)</strong>: não marcou estímulos corretos (d com 2 traços).</p>
              <p>• Aplicação individual ou coletiva, duração de ~8 minutos.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Escores Brutos */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Escores Brutos</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs sm:text-sm">Total Processados (TP)</Label>
              <Input type="number" min="0" value={totalProcessados} onChange={(e) => setTotalProcessados(e.target.value)} placeholder="Ex: 400" className="h-9 mt-1" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Total de itens examinados</p>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Acertos (d com 2 traços)</Label>
              <Input type="number" min="0" value={acertos} onChange={(e) => setAcertos(e.target.value)} placeholder="Ex: 160" className="h-9 mt-1" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Estímulos corretos marcados</p>
            </div>
          </div>
        </div>

        {/* Erros */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Erros</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs sm:text-sm">E1 - Erros Comissão</Label>
              <Input type="number" min="0" value={errosE1} onChange={(e) => setErrosE1(e.target.value)} placeholder="0" className="h-9 mt-1" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Estímulos errados marcados</p>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">E2 - Erros Omissão</Label>
              <Input type="number" min="0" value={errosE2} onChange={(e) => setErrosE2(e.target.value)} placeholder="0" className="h-9 mt-1" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Estímulos corretos não marcados</p>
            </div>
          </div>
        </div>

        {/* Resultados Calculados */}
        {results && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <Label className="text-xs font-medium text-primary uppercase tracking-wide">Escores Calculados</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-muted/30 rounded-lg">
                <span className="text-[10px] text-muted-foreground">Resultado Líquido (RL)</span>
                <p className="text-sm font-bold">{results.calculatedScores.rl}</p>
                <p className="text-[9px] text-muted-foreground">TP - (E1 + E2)</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[9px]">P{results.percentiles.rl}</Badge>
                  <Badge className={`${getClassColor(results.percentiles.rl)} text-[9px]`}>{results.classifications.rl}</Badge>
                </div>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <span className="text-[10px] text-muted-foreground">Índice de Concentração (IC)</span>
                <p className="text-sm font-bold">{results.calculatedScores.ic}</p>
                <p className="text-[9px] text-muted-foreground">Acertos - E1</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[9px]">P{results.percentiles.ic}</Badge>
                  <Badge className={`${getClassColor(results.percentiles.ic)} text-[9px]`}>{results.classifications.ic}</Badge>
                </div>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <span className="text-[10px] text-muted-foreground">% Erros</span>
                <p className="text-sm font-bold">{results.calculatedScores.erroPerc}%</p>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <span className="text-[10px] text-muted-foreground">Total Erros</span>
                <p className="text-sm font-bold">{results.calculatedScores.totalErros}</p>
                <p className="text-[9px] text-muted-foreground">E1 + E2</p>
              </div>
            </div>
          </div>
        )}

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
