import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  TAYLOR_TEST, 
  calculateTaylorResults, 
  isAgeValidForTaylor,
  getTaylorAgeGroupDescription,
  type TaylorScores,
  type TaylorResults 
} from '@/data/neuroTests/taylor';
import { AlertCircle, Info } from 'lucide-react';

interface NeuroTestTaylorFormProps {
  patientAge: number;
  onResultsChange: (results: TaylorResults | null) => void;
}

const NeuroTestTaylorForm: React.FC<NeuroTestTaylorFormProps> = ({
  patientAge,
  onResultsChange
}) => {
  const [scores, setScores] = useState<TaylorScores>({
    copia: 0,
    reproducaoMemoria: 0
  });
  const [results, setResults] = useState<TaylorResults | null>(null);

  const isValidAge = isAgeValidForTaylor(patientAge);
  const ageGroupDescription = getTaylorAgeGroupDescription(patientAge);

  useEffect(() => {
    if (isValidAge && scores.copia > 0) {
      const calculatedResults = calculateTaylorResults(scores, patientAge);
      setResults(calculatedResults);
      onResultsChange(calculatedResults);
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [scores, patientAge, isValidAge, onResultsChange]);

  const handleScoreChange = (field: keyof TaylorScores, value: string) => {
    const numValue = parseFloat(value) || 0;
    // Pontuação máxima é 36 (18 elementos × 2 pontos cada)
    const clampedValue = Math.min(Math.max(numValue, 0), 36);
    setScores(prev => ({ ...prev, [field]: clampedValue }));
  };

  const getClassificationBadgeColor = (classification: string) => {
    switch (classification) {
      case 'Superior': return 'bg-green-600 text-white';
      case 'Média Superior': return 'bg-green-500 text-white';
      case 'Média': return 'bg-blue-500 text-white';
      case 'Média Inferior': return 'bg-yellow-500 text-white';
      case 'Inferior': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!isValidAge) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {TAYLOR_TEST.name} - Idade Inválida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este teste é aplicável para pacientes com idade entre {TAYLOR_TEST.minAge} e {TAYLOR_TEST.maxAge} anos.
            A idade atual do paciente ({patientAge} anos) está fora desta faixa.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {TAYLOR_TEST.name}
          <Badge variant="outline" className="ml-2">
            {TAYLOR_TEST.minAge}-{TAYLOR_TEST.maxAge} anos
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{TAYLOR_TEST.fullName}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informação do grupo etário */}
        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">Grupo etário utilizado:</span>{' '}
            <span className="text-muted-foreground">{ageGroupDescription}</span>
          </div>
        </div>

        {/* Entrada de dados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="copia">Cópia (0-36 pontos)</Label>
            <Input
              id="copia"
              type="number"
              step="0.5"
              min="0"
              max="36"
              value={scores.copia || ''}
              onChange={(e) => handleScoreChange('copia', e.target.value)}
              placeholder="Pontos na cópia"
            />
            <p className="text-xs text-muted-foreground">
              18 elementos × 2 pontos cada = máx. 36 pontos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reproducaoMemoria">Reprodução da Memória (0-36 pontos)</Label>
            <Input
              id="reproducaoMemoria"
              type="number"
              step="0.5"
              min="0"
              max="36"
              value={scores.reproducaoMemoria || ''}
              onChange={(e) => handleScoreChange('reproducaoMemoria', e.target.value)}
              placeholder="Pontos da reprodução"
            />
            <p className="text-xs text-muted-foreground">
              Evocação tardia (delayed recall)
            </p>
          </div>
        </div>

        {/* Resultados */}
        {results && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Resultados
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Variável</th>
                    <th className="text-center py-2 px-3 font-medium">Bruto</th>
                    <th className="text-center py-2 px-3 font-medium">Z-Score</th>
                    <th className="text-center py-2 px-3 font-medium">Percentil</th>
                    <th className="text-center py-2 px-3 font-medium">Classificação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">Cópia</td>
                    <td className="text-center py-2 px-3">{results.rawScores.copia}</td>
                    <td className="text-center py-2 px-3">{results.zScores.copia}</td>
                    <td className="text-center py-2 px-3">{results.percentiles.copia}</td>
                    <td className="text-center py-2 px-3">
                      <Badge className={getClassificationBadgeColor(results.classifications.copia)}>
                        {results.classifications.copia}
                      </Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">Reprodução da Memória</td>
                    <td className="text-center py-2 px-3">{results.rawScores.reproducaoMemoria}</td>
                    <td className="text-center py-2 px-3">{results.zScores.reproducaoMemoria}</td>
                    <td className="text-center py-2 px-3">{results.percentiles.reproducaoMemoria}</td>
                    <td className="text-center py-2 px-3">
                      <Badge className={getClassificationBadgeColor(results.classifications.reproducaoMemoria)}>
                        {results.classifications.reproducaoMemoria}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legenda de classificação */}
            <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">Sistema de Classificação:</p>
              <p>≤5 = Inferior | 6-25 = Média Inferior | 26-74 = Média | 75-94 = Média Superior | ≥95 = Superior</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeuroTestTaylorForm;
