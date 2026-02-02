import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  calculateFASResults, 
  getFASClassificationColor,
  isAgeValidForFAS,
  type FASTestResult 
} from '@/data/neuroTests/fas';

interface NeuroTestFASFormProps {
  patientAge: number;
  onResultsChange: (results: FASTestResult | null) => void;
}

const NeuroTestFASForm: React.FC<NeuroTestFASFormProps> = ({
  patientAge,
  onResultsChange
}) => {
  const [letraF, setLetraF] = useState<string>('');
  const [letraA, setLetraA] = useState<string>('');
  const [letraS, setLetraS] = useState<string>('');
  const [results, setResults] = useState<FASTestResult | null>(null);

  const isValidAge = isAgeValidForFAS(patientAge);

  useEffect(() => {
    const f = parseInt(letraF) || 0;
    const a = parseInt(letraA) || 0;
    const s = parseInt(letraS) || 0;

    if (letraF && letraA && letraS && isValidAge) {
      const calculatedResults = calculateFASResults(f, a, s);
      setResults(calculatedResults);
      onResultsChange(calculatedResults);
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [letraF, letraA, letraS, patientAge, isValidAge, onResultsChange]);

  if (!isValidAge) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">
            O teste FAS é aplicável apenas para pacientes entre 19 e 59 anos.
            <br />
            Idade atual do paciente: {patientAge} anos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações do Teste */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Teste de Fluência Verbal Fonêmica FAS</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Idade do paciente: <strong>{patientAge} anos</strong>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Normas baseadas em adultos de alto letramento (19-59 anos).
          </p>
        </CardContent>
      </Card>

      {/* Pontuações Brutas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pontuações Brutas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="letraF">Letra F (acertos)</Label>
              <Input
                id="letraF"
                type="number"
                min="0"
                value={letraF}
                onChange={(e) => setLetraF(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="letraA">Letra A (acertos)</Label>
              <Input
                id="letraA"
                type="number"
                min="0"
                value={letraA}
                onChange={(e) => setLetraA(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="letraS">Letra S (acertos)</Label>
              <Input
                id="letraS"
                type="number"
                min="0"
                value={letraS}
                onChange={(e) => setLetraS(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados Calculados */}
      {results && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resultados Calculados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total FAS */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Pontuação Total FAS</h4>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div className="bg-muted p-3 rounded-lg text-center">
                  <p className="text-muted-foreground text-xs mb-1">F</p>
                  <p className="font-semibold">{results.letraF}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg text-center">
                  <p className="text-muted-foreground text-xs mb-1">A</p>
                  <p className="font-semibold">{results.letraA}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg text-center">
                  <p className="text-muted-foreground text-xs mb-1">S</p>
                  <p className="font-semibold">{results.letraS}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg text-center">
                  <p className="text-muted-foreground text-xs mb-1">Total</p>
                  <p className="font-bold text-lg">{results.totalFAS}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cálculos Normativos */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Análise Normativa</h4>
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Z-Score</p>
                    <p className="font-semibold">{results.zScore.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Pontuação - 43,5) / 10,9
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Percentil</p>
                    <p className="font-semibold">{results.percentile}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-muted-foreground text-xs mb-2">Classificação</p>
                  <Badge 
                    variant="outline"
                    className={`${getFASClassificationColor(results.classification)} font-semibold`}
                  >
                    {results.classification}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Legenda de Classificações */}
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-medium mb-2">Classificações por Percentil:</p>
              <div className="grid grid-cols-2 gap-1">
                <span>≤ 5: Inferior</span>
                <span>6-25: Média Inferior</span>
                <span>26-74: Média</span>
                <span>75-94: Média Superior</span>
                <span>≥ 95: Superior</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NeuroTestFASForm;
