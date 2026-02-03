import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Brain, Clock, XCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  HaylingInfantilResults,
  SchoolType,
  calculateHaylingInfantilResults,
  isAgeValidForHaylingInfantil,
} from '@/data/neuroTests/haylingInfantil';

interface NeuroTestHaylingInfantilFormProps {
  patientAge: number;
  onResultsChange: (results: HaylingInfantilResults | null) => void;
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

const NeuroTestHaylingInfantilForm: React.FC<NeuroTestHaylingInfantilFormProps> = ({
  patientAge,
  onResultsChange,
}) => {
  const [parteATempo, setParteATempo] = useState<string>('');
  const [parteBTempo, setParteBTempo] = useState<string>('');
  const [parteBErros, setParteBErros] = useState<string>('');
  const [schoolType, setSchoolType] = useState<SchoolType | ''>('');
  const [results, setResults] = useState<HaylingInfantilResults | null>(null);

  const isValidAge = isAgeValidForHaylingInfantil(patientAge);

  useEffect(() => {
    const parteATempoNum = parseFloat(parteATempo);
    const parteBTempoNum = parseFloat(parteBTempo);
    const parteBErrosNum = parseInt(parteBErros);

    if (
      !isNaN(parteATempoNum) &&
      !isNaN(parteBTempoNum) &&
      !isNaN(parteBErrosNum) &&
      parteATempoNum >= 0 &&
      parteBTempoNum >= 0 &&
      parteBErrosNum >= 0 &&
      schoolType !== '' &&
      isValidAge
    ) {
      const calculatedResults = calculateHaylingInfantilResults(
        parteATempoNum,
        parteBTempoNum,
        parteBErrosNum,
        patientAge,
        schoolType
      );
      setResults(calculatedResults);
      onResultsChange(calculatedResults);
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [parteATempo, parteBTempo, parteBErros, schoolType, patientAge, isValidAge, onResultsChange]);

  if (!isValidAge) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          O Hayling Infantil é válido apenas para crianças de 6 a 12 anos. 
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
            <Brain className="h-5 w-5 text-primary" />
            Hayling Infantil (6-12 anos)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção do tipo de escola */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Tipo de Escola
              <span className="text-destructive">*</span>
            </Label>
            <Select value={schoolType} onValueChange={(v) => setSchoolType(v as SchoolType)}>
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
            {/* Parte A - Tempo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Parte A - Tempo (s)
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="Ex: 15.5"
                value={parteATempo}
                onChange={(e) => setParteATempo(e.target.value)}
              />
            </div>

            {/* Parte B - Tempo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Parte B - Tempo (s)
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="Ex: 35.0"
                value={parteBTempo}
                onChange={(e) => setParteBTempo(e.target.value)}
              />
            </div>

            {/* Parte B - Erros */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                Parte B - Erros
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="Ex: 3"
                value={parteBErros}
                onChange={(e) => setParteBErros(e.target.value)}
              />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Parte A - Tempo */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Parte A - Tempo
                </div>
                <div className="text-2xl font-bold">{results.parteATempo.raw}s</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">P{results.parteATempo.percentile}</span>
                  <Badge className={getClassificationColor(results.parteATempo.classification)}>
                    {results.parteATempo.classification}
                  </Badge>
                </div>
              </div>

              {/* Parte B - Tempo */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Parte B - Tempo
                </div>
                <div className="text-2xl font-bold">{results.parteBTempo.raw}s</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">P{results.parteBTempo.percentile}</span>
                  <Badge className={getClassificationColor(results.parteBTempo.classification)}>
                    {results.parteBTempo.classification}
                  </Badge>
                </div>
              </div>

              {/* Parte B - Erros */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Parte B - Erros
                </div>
                <div className="text-2xl font-bold">{results.parteBErros.raw}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">P{results.parteBErros.percentile}</span>
                  <Badge className={getClassificationColor(results.parteBErros.classification)}>
                    {results.parteBErros.classification}
                  </Badge>
                </div>
              </div>

              {/* Inibição B-A */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Inibição (B-A)
                </div>
                <div className="text-2xl font-bold">{results.inibicaoBA.raw}s</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">P{results.inibicaoBA.percentile}</span>
                  <Badge className={getClassificationColor(results.inibicaoBA.classification)}>
                    {results.inibicaoBA.classification}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Interpretação:</strong> Percentis mais altos indicam melhor desempenho 
                (menor tempo/menos erros comparado à norma). A medida de Inibição (B-A) reflete 
                o custo adicional de tempo para inibir respostas automáticas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NeuroTestHaylingInfantilForm;
