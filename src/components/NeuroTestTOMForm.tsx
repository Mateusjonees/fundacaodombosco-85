import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Brain, Calculator, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TOM_TEST,
  calculateTOMResults,
  getTOMClassificationColor,
  isAgeValidForTOM,
  type TOMTestResult,
} from '@/data/neuroTests/tom';

interface NeuroTestTOMFormProps {
  patientAge: number;
  onResultsChange: (results: TOMTestResult | null) => void;
}

const NeuroTestTOMForm: React.FC<NeuroTestTOMFormProps> = ({
  patientAge,
  onResultsChange,
}) => {
  const [totalScore, setTotalScore] = useState<string>('');
  const [results, setResults] = useState<TOMTestResult | null>(null);

  const ageYears = Math.floor(patientAge);
  const isValidAge = isAgeValidForTOM(ageYears);

  useEffect(() => {
    if (!isValidAge) {
      setResults(null);
      onResultsChange(null);
      return;
    }

    const score = parseInt(totalScore);
    
    if (isNaN(score) || score < 0 || score > 24) {
      setResults(null);
      onResultsChange(null);
      return;
    }

    const calculatedResults = calculateTOMResults(score, ageYears);
    setResults(calculatedResults);
    onResultsChange(calculatedResults);
  }, [totalScore, ageYears, isValidAge, onResultsChange]);

  if (!isValidAge) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          O teste ToM é válido apenas para crianças de {TOM_TEST.minAge} a {TOM_TEST.maxAge} anos.
          Idade do paciente: {ageYears} anos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {TOM_TEST.fullName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {TOM_TEST.description}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Idade do paciente: {ageYears} anos | Pontuação máxima: 24 pontos
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entrada de dados */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Pontuação
          </h4>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalScore">Total de Acertos (0-24)</Label>
              <Input
                id="totalScore"
                type="number"
                min="0"
                max="24"
                value={totalScore}
                onChange={(e) => setTotalScore(e.target.value)}
                placeholder="Pontuação total"
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Soma de todos os pontos das questões-teste
              </p>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {results && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Resultados Calculados</h4>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Pontuação</p>
                  <p className="text-lg font-semibold">{results.totalScore}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Z-Score</p>
                  <p className="text-lg font-semibold">{results.zScore}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Percentil</p>
                  <p className="text-lg font-semibold">{results.percentile}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Classificação</p>
                  <Badge 
                    variant="outline" 
                    className={getTOMClassificationColor(results.classification)}
                  >
                    {results.classification}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informações sobre as tarefas */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <p className="font-medium mb-2">Estrutura do Teste:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>9 tarefas com dificuldade crescente</li>
            <li>17 questões-teste e 10 questões de controle</li>
            <li>Questões E, F, G e H podem receber ponto extra pela justificativa</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuroTestTOMForm;
