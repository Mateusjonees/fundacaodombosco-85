import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { X, ChevronDown, ChevronUp, Brain, GraduationCap, Clock, Calculator } from 'lucide-react';
import { 
  TMT_ADULTO_TEST, 
  EDUCATION_LEVELS, 
  type EducationLevel, 
  type TMTAdultoResults,
  getAgeGroup
} from '@/data/neuroTests/tmtAdulto';
import { 
  calculateTMTAdultoResults, 
  getTMTAdultoAgeGroupName,
  isAgeValidForTMTAdulto
} from '@/data/neuroTests/tmtAdultoPercentiles';

interface NeuroTestTMTAdultoFormProps {
  patientAge: number;
  onResultsChange: (results: TMTAdultoResults) => void;
  onRemove?: () => void;
}

const getClassificationColor = (classification: string): string => {
  switch (classification) {
    case 'Muito Superior':
    case 'Superior':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'Média Superior':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
    case 'Média':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'Média Inferior':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'Inferior':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
    case 'Muito Inferior':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  }
};

export default function NeuroTestTMTAdultoForm({ 
  patientAge, 
  onResultsChange, 
  onRemove 
}: NeuroTestTMTAdultoFormProps) {
  const [tempoA, setTempoA] = useState<string>('');
  const [tempoB, setTempoB] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel | ''>('');
  const [notes, setNotes] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [calculatedResults, setCalculatedResults] = useState<ReturnType<typeof calculateTMTAdultoResults>>(null);

  const ageGroup = getAgeGroup(patientAge);
  const isValidAge = isAgeValidForTMTAdulto(patientAge);

  // Calcular resultados quando os valores mudam
  useEffect(() => {
    const tA = parseFloat(tempoA);
    const tB = parseFloat(tempoB);
    
    if (!isNaN(tA) && !isNaN(tB) && tA > 0 && tB > 0 && educationLevel && isValidAge) {
      const results = calculateTMTAdultoResults(patientAge, educationLevel, tA, tB);
      setCalculatedResults(results);
      
      if (results) {
        onResultsChange({
          rawScores: {
            tempoA: tA,
            tempoB: tB,
            educationLevel
          },
          calculatedScores: results.calculatedScores,
          percentiles: results.percentiles,
          classifications: results.classifications,
          notes
        });
      }
    } else {
      setCalculatedResults(null);
    }
  }, [tempoA, tempoB, educationLevel, patientAge, notes, isValidAge, onResultsChange]);

  if (!isValidAge) {
    return (
      <Card className="border-destructive">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              {TMT_ADULTO_TEST.name}
            </span>
            {onRemove && (
              <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 px-4">
          <p className="text-sm text-destructive">
            Este teste é válido apenas para adultos de 19 a 75 anos. 
            Idade do paciente: {patientAge} anos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="py-3 px-4 bg-primary/5">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {TMT_ADULTO_TEST.name}
            <Badge variant="outline" className="text-xs">
              {patientAge} anos
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {getTMTAdultoAgeGroupName(patientAge)}
            </Badge>
          </span>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4 px-4 space-y-4">
        {/* Seleção de Escolaridade - OBRIGATÓRIO */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <GraduationCap className="h-4 w-4" />
            Escolaridade <span className="text-destructive">*</span>
          </Label>
          <Select value={educationLevel} onValueChange={(v) => setEducationLevel(v as EducationLevel)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a escolaridade do paciente" />
            </SelectTrigger>
            <SelectContent>
              {EDUCATION_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entrada de Tempos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3" />
              Tempo A (segundos)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 35.5"
              value={tempoA}
              onChange={(e) => setTempoA(e.target.value)}
              className="text-center"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3" />
              Tempo B (segundos)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 72.3"
              value={tempoB}
              onChange={(e) => setTempoB(e.target.value)}
              className="text-center"
            />
          </div>
        </div>

        {/* Resultados Calculados */}
        {calculatedResults && (
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between" size="sm">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Resultados Calculados
                </span>
                {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                {/* Tempo A */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Tempo A:</span>
                  <div className="flex items-center gap-2">
                    <span>{calculatedResults.calculatedScores.tempoA.toFixed(2)}s</span>
                    <Badge variant="outline">P {calculatedResults.percentiles.tempoA}</Badge>
                    <Badge className={getClassificationColor(calculatedResults.classifications.tempoA)}>
                      {calculatedResults.classifications.tempoA}
                    </Badge>
                  </div>
                </div>

                {/* Tempo B */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Tempo B:</span>
                  <div className="flex items-center gap-2">
                    <span>{calculatedResults.calculatedScores.tempoB.toFixed(2)}s</span>
                    <Badge variant="outline">P {calculatedResults.percentiles.tempoB}</Badge>
                    <Badge className={getClassificationColor(calculatedResults.classifications.tempoB)}>
                      {calculatedResults.classifications.tempoB}
                    </Badge>
                  </div>
                </div>

                {/* Tempo B-A */}
                <div className="flex items-center justify-between text-sm border-t pt-2">
                  <span className="font-medium">Tempo B-A (diferença):</span>
                  <div className="flex items-center gap-2">
                    <span>{calculatedResults.calculatedScores.tempoBA.toFixed(2)}s</span>
                    <Badge variant="outline">P {calculatedResults.percentiles.tempoBA}</Badge>
                    <Badge className={getClassificationColor(calculatedResults.classifications.tempoBA)}>
                      {calculatedResults.classifications.tempoBA}
                    </Badge>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Notas */}
        <div className="space-y-2">
          <Label className="text-sm">Observações (opcional)</Label>
          <Textarea
            placeholder="Observações sobre a aplicação do teste..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[60px] text-sm"
          />
        </div>

        {/* Aviso se não preencheu escolaridade */}
        {!educationLevel && (tempoA || tempoB) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Selecione a escolaridade para calcular os percentis e classificações.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export type { TMTAdultoResults };
