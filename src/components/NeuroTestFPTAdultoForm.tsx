import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, AlertCircle, Info } from 'lucide-react';
import {
  FPT_ADULTO_TEST,
  AGE_GROUP_OPTIONS,
  calculateFPTAdultoResults,
  getAgeGroupForFPTAdulto,
  isAgeValidForFPTAdulto,
  type FPTAdultoAgeGroup,
  type FPTAdultoResults
} from '@/data/neuroTests/fptAdulto';

interface NeuroTestFPTAdultoFormProps {
  patientAge: number;
  onResultsChange: (results: FPTAdultoResults | null) => void;
}

export default function NeuroTestFPTAdultoForm({
  patientAge,
  onResultsChange
}: NeuroTestFPTAdultoFormProps) {
  const [uniqueDesigns, setUniqueDesigns] = useState<string>('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<FPTAdultoAgeGroup | ''>('');
  const [results, setResults] = useState<FPTAdultoResults | null>(null);

  // Determinar a faixa etária automaticamente
  useEffect(() => {
    if (patientAge && isAgeValidForFPTAdulto(patientAge)) {
      const autoAgeGroup = getAgeGroupForFPTAdulto(patientAge);
      if (autoAgeGroup) {
        setSelectedAgeGroup(autoAgeGroup);
      }
    }
  }, [patientAge]);

  // Calcular resultados quando o valor muda
  useEffect(() => {
    if (uniqueDesigns && selectedAgeGroup) {
      const rawScore = parseInt(uniqueDesigns, 10);
      if (!isNaN(rawScore) && rawScore >= 0) {
        const calculatedResults = calculateFPTAdultoResults(rawScore, selectedAgeGroup);
        setResults(calculatedResults);
        onResultsChange(calculatedResults);
      } else {
        setResults(null);
        onResultsChange(null);
      }
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [uniqueDesigns, selectedAgeGroup, onResultsChange]);

  const getClassificationColor = (classification: string): string => {
    switch (classification) {
      case 'Superior':
        return 'bg-green-500';
      case 'Média Superior':
        return 'bg-blue-500';
      case 'Média':
        return 'bg-gray-500';
      case 'Média Inferior':
        return 'bg-orange-500';
      case 'Inferior':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (!isAgeValidForFPTAdulto(patientAge)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          O FPT Adulto é aplicável para pacientes entre 20 e 99 anos.
          Idade do paciente: {patientAge} anos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {FPT_ADULTO_TEST.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {FPT_ADULTO_TEST.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            O teste utiliza o período de <strong>2 minutos</strong>.
            As normas são estratificadas por faixa etária.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Seletor de Faixa Etária */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Faixa Etária</Label>
            <Select
              value={selectedAgeGroup}
              onValueChange={(value) => setSelectedAgeGroup(value as FPTAdultoAgeGroup)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a faixa etária" />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Idade do paciente: {patientAge} anos
            </p>
          </div>

          {/* Desenhos Únicos */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Desenhos Únicos</Label>
            <Input
              type="number"
              min="0"
              max="80"
              value={uniqueDesigns}
              onChange={(e) => setUniqueDesigns(e.target.value)}
              placeholder="Total de desenhos não repetidos"
              className="text-center"
            />
            <p className="text-xs text-muted-foreground">
              Total de figuras únicas em 2 minutos
            </p>
          </div>
        </div>

        {/* Resultados */}
        {results && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold mb-3">Resultados</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Medida</th>
                    <th className="text-center py-2 px-2">Pontuação</th>
                    <th className="text-center py-2 px-2">Percentil</th>
                    <th className="text-center py-2 px-2">Classificação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-2 font-medium">Desenhos Únicos</td>
                    <td className="text-center py-2 px-2">{results.rawScore}</td>
                    <td className="text-center py-2 px-2">
                      {results.percentile !== null ? results.percentile : '-'}
                    </td>
                    <td className="text-center py-2 px-2">
                      <Badge className={getClassificationColor(results.classification)}>
                        {results.classification}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>Faixa etária:</strong> {results.ageGroup} anos
            </p>
          </div>
        )}

        {!results && uniqueDesigns && selectedAgeGroup && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Normas não disponíveis para esta combinação de pontuação e faixa etária.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
