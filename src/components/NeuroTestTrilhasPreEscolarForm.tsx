import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  TRILHAS_PRE_ESCOLAR_TEST,
  getStandardScoreClassificationPreEscolar,
  getClassificationColorPreEscolar,
  isAgeValidForTrilhasPreEscolar,
  TrilhasPreEscolarTestResult,
} from '@/data/neuroTests/trilhasPreEscolar';
import {
  lookupTrilhasPreEscolarAStandardScore,
  lookupTrilhasPreEscolarBStandardScore,
  getTrilhasPreEscolarAgeGroupName,
} from '@/data/neuroTests/trilhasPreEscolarStandardScores';

interface NeuroTestTrilhasPreEscolarFormProps {
  patientAge: number;
  onResultsChange: (results: TrilhasPreEscolarTestResult | null) => void;
}

const NeuroTestTrilhasPreEscolarForm: React.FC<NeuroTestTrilhasPreEscolarFormProps> = ({
  patientAge,
  onResultsChange,
}) => {
  const [sequenciasA, setSequenciasA] = useState<string>('');
  const [sequenciasB, setSequenciasB] = useState<string>('');
  const [results, setResults] = useState<TrilhasPreEscolarTestResult | null>(null);

  const isValidAge = isAgeValidForTrilhasPreEscolar(patientAge);

  useEffect(() => {
    if (!isValidAge) {
      setResults(null);
      onResultsChange(null);
      return;
    }

    const seqA = parseInt(sequenciasA);
    const seqB = parseInt(sequenciasB);

    if (isNaN(seqA) || isNaN(seqB)) {
      setResults(null);
      onResultsChange(null);
      return;
    }

    // Validar limites
    if (seqA < 1 || seqA > 5 || seqB < 1 || seqB > 10) {
      setResults(null);
      onResultsChange(null);
      return;
    }

    // Calcular escores padrão
    const standardScoreA = lookupTrilhasPreEscolarAStandardScore(patientAge, seqA);
    const standardScoreB = lookupTrilhasPreEscolarBStandardScore(patientAge, seqB);

    const classificationA = standardScoreA ? getStandardScoreClassificationPreEscolar(standardScoreA) : 'N/A';
    const classificationB = standardScoreB ? getStandardScoreClassificationPreEscolar(standardScoreB) : 'N/A';

    const newResults: TrilhasPreEscolarTestResult = {
      sequenciasA: seqA,
      sequenciasB: seqB,
      standardScoreA,
      standardScoreB,
      classificationA,
      classificationB,
    };

    setResults(newResults);
    onResultsChange(newResults);
  }, [sequenciasA, sequenciasB, patientAge, isValidAge, onResultsChange]);

  if (!isValidAge) {
    return (
      <Card className="border-destructive">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {TRILHAS_PRE_ESCOLAR_TEST.fullName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Este teste é válido apenas para crianças de 4 a 6 anos.
            A idade do paciente ({Math.floor(patientAge)} anos) está fora da faixa.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          {TRILHAS_PRE_ESCOLAR_TEST.fullName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Faixa etária: 4-6 anos | Paciente: {getTrilhasPreEscolarAgeGroupName(patientAge)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entrada de dados */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sequenciasA">
              Sequências A <span className="text-muted-foreground">(1-5)</span>
            </Label>
            <Input
              id="sequenciasA"
              type="number"
              min={1}
              max={5}
              value={sequenciasA}
              onChange={(e) => setSequenciasA(e.target.value)}
              placeholder="Total de sequências"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sequenciasB">
              Sequências B <span className="text-muted-foreground">(1-10)</span>
            </Label>
            <Input
              id="sequenciasB"
              type="number"
              min={1}
              max={10}
              value={sequenciasB}
              onChange={(e) => setSequenciasB(e.target.value)}
              placeholder="Total de sequências"
            />
          </div>
        </div>

        {/* Resultados */}
        {results && (
          <div className="mt-4 space-y-3">
            <h4 className="font-medium text-sm">Resultados Calculados</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Sequências A */}
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="font-medium text-sm">Sequências A</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bruto:</span>
                    <span className="ml-1 font-medium">{results.sequenciasA}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">EP:</span>
                    <span className="ml-1 font-medium">
                      {results.standardScoreA ?? 'N/A'}
                    </span>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={getClassificationColorPreEscolar(results.classificationA)}
                    >
                      {results.classificationA}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Sequências B */}
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="font-medium text-sm">Sequências B</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bruto:</span>
                    <span className="ml-1 font-medium">{results.sequenciasB}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">EP:</span>
                    <span className="ml-1 font-medium">
                      {results.standardScoreB ?? 'N/A'}
                    </span>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={getClassificationColorPreEscolar(results.classificationB)}
                    >
                      {results.classificationB}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Legenda de Classificações */}
            <div className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">EP = Escore Padrão</span> (M=100, DP=15) | 
              Classificações: &lt;70 Muito Baixa | 70-84 Baixa | 85-114 Média | 115-129 Alta | ≥130 Muito Alta
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeuroTestTrilhasPreEscolarForm;
