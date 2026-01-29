import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, X, ArrowRight, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateBNTBRResults, getAgeRangeInfo } from '@/data/neuroTests/bntbrNorms';
import { getBNTBRClassification, getBNTBRClassificationColor, type BNTBRResults } from '@/data/neuroTests/bntbr';

interface NeuroTestBNTBRFormProps {
  patientAge: number;
  onResultsChange: (results: BNTBRResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestBNTBRForm({
  patientAge,
  onResultsChange,
  onRemove
}: NeuroTestBNTBRFormProps) {
  const [acertos, setAcertos] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [results, setResults] = useState<BNTBRResults | null>(null);

  const calculateResults = useCallback(() => {
    const acertosNum = parseInt(acertos) || 0;

    // Valida se há entrada
    if (!acertos || acertosNum < 0 || acertosNum > 30) {
      setResults(null);
      onResultsChange(null);
      return;
    }

    // Calcula os resultados
    const calcResults = calculateBNTBRResults(patientAge, acertosNum);

    if (!calcResults) {
      setResults(null);
      onResultsChange(null);
      return;
    }

    const classification = getBNTBRClassification(calcResults.percentil);

    const newResults: BNTBRResults = {
      rawScores: {
        acertos: acertosNum
      },
      calculatedScores: {
        pontuacao: calcResults.pontuacao,
        zScore: calcResults.zScore,
        percentil: calcResults.percentil
      },
      classifications: {
        classificacao: classification
      },
      notes: notes || undefined
    };

    setResults(newResults);
    onResultsChange(newResults);
  }, [acertos, notes, patientAge, onResultsChange]);

  useEffect(() => {
    calculateResults();
  }, [calculateResults]);

  // Atualiza notes sem recalcular
  useEffect(() => {
    if (results) {
      const updatedResults = { ...results, notes: notes || undefined };
      onResultsChange(updatedResults);
    }
  }, [notes]);

  const ageRangeInfo = getAgeRangeInfo(patientAge);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            BNT-BR - Teste de Nomeação de Boston
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{patientAge} anos</Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Norma: {ageRangeInfo}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entrada de dados */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Total de Acertos (0-30)</Label>
          <Input
            type="number"
            min={0}
            max={30}
            value={acertos}
            onChange={(e) => setAcertos(e.target.value)}
            placeholder="Número de acertos"
            className="max-w-[150px]"
          />
        </div>

        {/* Resultados Calculados */}
        {results && (
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pontuação */}
              <div className="p-3 bg-muted/30 rounded-lg border text-center">
                <p className="text-xs font-medium text-muted-foreground mb-1">Pontuação</p>
                <Badge variant="outline" className="font-mono text-lg">
                  {results.calculatedScores.pontuacao}
                </Badge>
              </div>

              {/* Z-Score e Percentil */}
              <div className="p-3 bg-muted/30 rounded-lg border text-center">
                <p className="text-xs font-medium text-muted-foreground mb-1">Z-Score → Percentil</p>
                <div className="flex items-center justify-center gap-1">
                  <Badge variant="outline" className="font-mono">
                    {results.calculatedScores.zScore.toFixed(2)}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="secondary" className="font-mono">
                    P{results.calculatedScores.percentil}
                  </Badge>
                </div>
              </div>

              {/* Classificação */}
              <div className="p-3 bg-primary/10 rounded-lg border text-center">
                <p className="text-xs font-medium text-muted-foreground mb-1">Classificação</p>
                <Badge 
                  variant="default" 
                  className={`${getBNTBRClassificationColor(results.classifications.classificacao)}`}
                >
                  {results.classifications.classificacao}
                </Badge>
              </div>
            </div>

            {/* Fórmula explicativa */}
            <div className="p-2 bg-muted/30 rounded-lg text-xs text-muted-foreground">
              <p className="font-mono">
                Z = ({results.rawScores.acertos} - M) / DP → Z = {results.calculatedScores.zScore.toFixed(2)} → Percentil {results.calculatedScores.percentil}
              </p>
            </div>

            {/* Escala de classificação */}
            <div className="p-2 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Escala de Classificação:</p>
              <div className="flex flex-wrap gap-1 text-xs">
                <Badge variant="outline" className="text-red-600 dark:text-red-400">≤5: Inferior</Badge>
                <Badge variant="outline" className="text-orange-600 dark:text-orange-400">6-25: Média Inferior</Badge>
                <Badge variant="outline" className="text-gray-600 dark:text-gray-400">26-74: Média</Badge>
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400">75-94: Média Superior</Badge>
                <Badge variant="outline" className="text-green-600 dark:text-green-400">≥95: Superior</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="space-y-2 pt-3 border-t">
          <Label className="text-sm font-medium">Observações (opcional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre a aplicação do teste..."
            className="min-h-[60px] resize-none text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
