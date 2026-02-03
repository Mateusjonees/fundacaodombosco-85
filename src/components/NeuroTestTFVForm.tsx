import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Brain, MessageSquare, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TFVResults,
  TFVSchoolType,
  calculateTFVResults,
  isAgeValidForTFV,
} from '@/data/neuroTests/tfv';

interface NeuroTestTFVFormProps {
  patientAge: number;
  onResultsChange: (results: TFVResults | null) => void;
}

const getClassificationColor = (classification: string) => {
  switch (classification) {
    case 'Superior':
      return 'bg-purple-500 text-white';
    case 'Média Superior':
      return 'bg-blue-500 text-white';
    case 'Média':
      return 'bg-green-500 text-white';
    case 'Média Inferior':
      return 'bg-yellow-500 text-black';
    case 'Inferior':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const NeuroTestTFVForm: React.FC<NeuroTestTFVFormProps> = ({
  patientAge,
  onResultsChange,
}) => {
  const [fluenciaLivre, setFluenciaLivre] = useState<string>('');
  const [fluenciaFonemica, setFluenciaFonemica] = useState<string>('');
  const [fluenciaSemantica, setFluenciaSemantica] = useState<string>('');
  const [schoolType, setSchoolType] = useState<TFVSchoolType | ''>('');
  const [results, setResults] = useState<TFVResults | null>(null);

  const isValidAge = isAgeValidForTFV(patientAge);

  useEffect(() => {
    const livreNum = parseInt(fluenciaLivre);
    const fonemicaNum = parseInt(fluenciaFonemica);
    const semanticaNum = parseInt(fluenciaSemantica);

    if (
      !isNaN(livreNum) &&
      !isNaN(fonemicaNum) &&
      !isNaN(semanticaNum) &&
      livreNum >= 0 &&
      fonemicaNum >= 0 &&
      semanticaNum >= 0 &&
      schoolType !== '' &&
      isValidAge
    ) {
      const calculatedResults = calculateTFVResults(
        livreNum,
        fonemicaNum,
        semanticaNum,
        patientAge,
        schoolType
      );
      setResults(calculatedResults);
      onResultsChange(calculatedResults);
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [fluenciaLivre, fluenciaFonemica, fluenciaSemantica, schoolType, patientAge, isValidAge, onResultsChange]);

  if (!isValidAge) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          O TFV é válido apenas para crianças de 6 a 12 anos. 
          Idade do paciente: {patientAge.toFixed(1)} anos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            TFV - Tarefas de Fluência Verbal (6-12 anos)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção do tipo de escola */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Tipo de Escola
              <span className="text-destructive">*</span>
            </Label>
            <Select value={schoolType} onValueChange={(v) => setSchoolType(v as TFVSchoolType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de escola..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="privada">Escola Privada (Particular)</SelectItem>
                <SelectItem value="publica">Escola Pública</SelectItem>
              </SelectContent>
            </Select>
            {schoolType === '' && (
              <p className="text-xs text-muted-foreground">
                ⚠️ Selecione o tipo de escola para usar a norma correta
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fluência Verbal Livre */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Fluência Verbal Livre
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="Total de acertos"
                value={fluenciaLivre}
                onChange={(e) => setFluenciaLivre(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Palavras evocadas livremente
              </p>
            </div>

            {/* Fluência Verbal Fonêmica (Letra P) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Fluência Fonêmica (Letra P)
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="Total de acertos"
                value={fluenciaFonemica}
                onChange={(e) => setFluenciaFonemica(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Palavras iniciadas com P
              </p>
            </div>

            {/* Fluência Verbal Semântica (Vestimentas) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Fluência Semântica (Vestimentas)
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="Total de acertos"
                value={fluenciaSemantica}
                onChange={(e) => setFluenciaSemantica(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Roupas/vestimentas evocadas
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Idade do paciente: {patientAge.toFixed(1)} anos | 
            Norma utilizada: {Math.round(patientAge)} anos - Escola {schoolType === 'privada' ? 'Privada' : schoolType === 'publica' ? 'Pública' : '(selecione)'}
          </p>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Resultados Calculados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fluência Verbal Livre */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Fluência Verbal Livre
                </div>
                <div className="text-2xl font-bold">{results.fluenciaLivre.raw}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">
                    {results.fluenciaLivre.percentile.includes('-') || results.fluenciaLivre.percentile.includes('<') || results.fluenciaLivre.percentile.includes('>') 
                      ? `P${results.fluenciaLivre.percentile}` 
                      : `P${results.fluenciaLivre.percentile}`}
                  </span>
                  <Badge className={getClassificationColor(results.fluenciaLivre.classification)}>
                    {results.fluenciaLivre.classification}
                  </Badge>
                </div>
              </div>

              {/* Fluência Verbal Fonêmica */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Fluência Fonêmica (P)
                </div>
                <div className="text-2xl font-bold">{results.fluenciaFonemica.raw}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">
                    P{results.fluenciaFonemica.percentile}
                  </span>
                  <Badge className={getClassificationColor(results.fluenciaFonemica.classification)}>
                    {results.fluenciaFonemica.classification}
                  </Badge>
                </div>
              </div>

              {/* Fluência Verbal Semântica */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Fluência Semântica (Vest.)
                </div>
                <div className="text-2xl font-bold">{results.fluenciaSemantica.raw}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">
                    P{results.fluenciaSemantica.percentile}
                  </span>
                  <Badge className={getClassificationColor(results.fluenciaSemantica.classification)}>
                    {results.fluenciaSemantica.classification}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Interpretação:</strong> Os percentis indicam a posição do desempenho 
                em relação à amostra normativa. Percentis mais altos indicam melhor desempenho.
                O percentil pode aparecer como valor exato (5, 25, 50, 75, 95) ou como faixa 
                (&lt;5, 5-25, 25-50, 50-75, 75-95, &gt;95) quando a pontuação está entre dois valores normativos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NeuroTestTFVForm;
