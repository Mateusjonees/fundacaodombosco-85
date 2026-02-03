import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { X, AlertTriangle, Brain, Timer, AlertCircle, Minus } from 'lucide-react';
import {
  HAYLING_ADULTO_TEST,
  HAYLING_EDUCATION_LEVELS,
  isAgeValidForHayling,
  calculateHaylingResults,
  getHaylingClassificationColor,
  type HaylingEducationLevel,
  type HaylingResults
} from '@/data/neuroTests/haylingAdulto';

interface NeuroTestHaylingAdultoFormProps {
  patientAge: number;
  onResultsChange: (results: HaylingResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestHaylingAdultoForm({
  patientAge,
  onResultsChange,
  onRemove
}: NeuroTestHaylingAdultoFormProps) {
  const [educationLevel, setEducationLevel] = useState<HaylingEducationLevel | ''>('');
  const [tempoA, setTempoA] = useState<string>('');
  const [tempoB, setTempoB] = useState<string>('');
  const [errosB, setErrosB] = useState<string>('');
  const [results, setResults] = useState<HaylingResults | null>(null);

  const isValidAge = isAgeValidForHayling(patientAge);

  const calculateResults = useCallback(() => {
    if (!educationLevel || !tempoA || !tempoB || errosB === '') {
      setResults(null);
      onResultsChange(null);
      return;
    }

    const tempoANum = parseFloat(tempoA);
    const tempoBNum = parseFloat(tempoB);
    const errosBNum = parseFloat(errosB);

    if (isNaN(tempoANum) || isNaN(tempoBNum) || isNaN(errosBNum)) {
      setResults(null);
      onResultsChange(null);
      return;
    }

    const calculatedResults = calculateHaylingResults(
      patientAge,
      educationLevel,
      tempoANum,
      tempoBNum,
      errosBNum
    );

    setResults(calculatedResults);
    onResultsChange(calculatedResults);
  }, [patientAge, educationLevel, tempoA, tempoB, errosB, onResultsChange]);

  useEffect(() => {
    calculateResults();
  }, [calculateResults]);

  if (!isValidAge) {
    return (
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">
              O teste Hayling Adulto é indicado para pacientes de 19 a 75 anos.
              Idade atual: {patientAge} anos.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {HAYLING_ADULTO_TEST.name}
          </CardTitle>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {HAYLING_ADULTO_TEST.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Escolaridade */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Escolaridade <span className="text-destructive">*</span>
          </Label>
          <Select
            value={educationLevel}
            onValueChange={(value) => setEducationLevel(value as HaylingEducationLevel)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a escolaridade..." />
            </SelectTrigger>
            <SelectContent>
              {HAYLING_EDUCATION_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {educationLevel && (
          <>
            <Separator />

            {/* Parte A - Tempo */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-500" />
                Parte A - Tempo
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tempo Total (segundos)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 16.5"
                    value={tempoA}
                    onChange={(e) => setTempoA(e.target.value)}
                  />
                </div>
                {results && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Resultado</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Badge variant="outline" className="text-xs">
                        Percentil: {results.percentiles.tempoA}
                      </Badge>
                      <span className={`text-sm font-medium ${getHaylingClassificationColor(results.classifications.tempoA)}`}>
                        {results.classifications.tempoA}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Parte B - Tempo */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4 text-purple-500" />
                Parte B - Tempo
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tempo Total (segundos)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 45.2"
                    value={tempoB}
                    onChange={(e) => setTempoB(e.target.value)}
                  />
                </div>
                {results && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Resultado</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Badge variant="outline" className="text-xs">
                        Percentil: {results.percentiles.tempoB}
                      </Badge>
                      <span className={`text-sm font-medium ${getHaylingClassificationColor(results.classifications.tempoB)}`}>
                        {results.classifications.tempoB}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Parte B - Erros */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Parte B - Erros
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Total de Erros (0-45)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="45"
                    placeholder="Ex: 12"
                    value={errosB}
                    onChange={(e) => setErrosB(e.target.value)}
                  />
                </div>
                {results && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Resultado</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Badge variant="outline" className="text-xs">
                        Percentil: {results.percentiles.errosB}
                      </Badge>
                      <span className={`text-sm font-medium ${getHaylingClassificationColor(results.classifications.errosB)}`}>
                        {results.classifications.errosB}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Inibição B-A (Calculado) */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Minus className="h-4 w-4 text-green-500" />
                Inibição B-A (Calculado)
              </h4>
              {results ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Pontuação</Label>
                    <div className="h-10 flex items-center">
                      <span className="text-sm font-medium">
                        {results.calculatedScores.inibiçãoBA.toFixed(2)} seg
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Percentil</Label>
                    <div className="h-10 flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {results.percentiles.inibiçãoBA}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Classificação</Label>
                    <div className="h-10 flex items-center">
                      <span className={`text-sm font-medium ${getHaylingClassificationColor(results.classifications.inibiçãoBA)}`}>
                        {results.classifications.inibiçãoBA}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Preencha os tempos acima para calcular a inibição.
                </p>
              )}
            </div>

            {/* Resumo Final */}
            {results && (
              <>
                <Separator />
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium">Resumo dos Resultados</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Parte A (Tempo)</span>
                      <div className={`font-medium ${getHaylingClassificationColor(results.classifications.tempoA)}`}>
                        {results.classifications.tempoA}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Parte B (Tempo)</span>
                      <div className={`font-medium ${getHaylingClassificationColor(results.classifications.tempoB)}`}>
                        {results.classifications.tempoB}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Parte B (Erros)</span>
                      <div className={`font-medium ${getHaylingClassificationColor(results.classifications.errosB)}`}>
                        {results.classifications.errosB}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Inibição B-A</span>
                      <div className={`font-medium ${getHaylingClassificationColor(results.classifications.inibiçãoBA)}`}>
                        {results.classifications.inibiçãoBA}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export type { HaylingResults };
