import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Brain, Calculator, Trash2, AlertCircle } from 'lucide-react';
import { TRILHAS_TEST, getTrilhasClassification, getTrilhasClassificationColor } from '@/data/neuroTests/trilhas';
import { 
  lookupTrilhasAStandardScore, 
  lookupTrilhasBStandardScore, 
  lookupTrilhasBAStandardScore,
  getTrilhasAgeGroupName, 
  isAgeValidForTrilhas 
} from '@/data/neuroTests/trilhasStandardScores';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface TrilhasResults {
  rawScores: {
    sequenciasA: number;
    sequenciasB: number;
    diferencaBA: number;
  };
  calculatedScores: {
    escorePadraoA: number | null;
    escorePadraoB: number | null;
    escorePadraoBA: number | null;
  };
  percentiles: Record<string, number>;
  classifications: {
    sequenciasA: string;
    sequenciasB: string;
    diferencaBA: string;
  };
  notes: string;
}

interface NeuroTestTrilhasFormProps {
  patientAge: number;
  onResultsChange: (results: TrilhasResults) => void;
  onRemove: () => void;
}

export default function NeuroTestTrilhasForm({
  patientAge,
  onResultsChange,
  onRemove
}: NeuroTestTrilhasFormProps) {
  const [sequenciasA, setSequenciasA] = useState(0);
  const [sequenciasB, setSequenciasB] = useState(0);
  const [notes, setNotes] = useState('');

  const isValidAge = isAgeValidForTrilhas(patientAge);

  // Calcular diferença B-A
  const diferencaBA = sequenciasB - sequenciasA;

  // Calcular resultados quando os scores mudam
  useEffect(() => {
    const escorePadraoA = lookupTrilhasAStandardScore(patientAge, sequenciasA);
    const escorePadraoB = lookupTrilhasBStandardScore(patientAge, sequenciasB);
    const escorePadraoBA = lookupTrilhasBAStandardScore(patientAge, diferencaBA);
    
    const results: TrilhasResults = {
      rawScores: {
        sequenciasA,
        sequenciasB,
        diferencaBA
      },
      calculatedScores: {
        escorePadraoA,
        escorePadraoB,
        escorePadraoBA
      },
      percentiles: {},
      classifications: {
        sequenciasA: escorePadraoA !== null ? getTrilhasClassification(escorePadraoA) : 'Não classificado',
        sequenciasB: escorePadraoB !== null ? getTrilhasClassification(escorePadraoB) : 'Não classificado',
        diferencaBA: escorePadraoBA !== null ? getTrilhasClassification(escorePadraoBA) : 'Não classificado'
      },
      notes
    };

    onResultsChange(results);
  }, [sequenciasA, sequenciasB, notes, patientAge, diferencaBA, onResultsChange]);

  const escorePadraoA = lookupTrilhasAStandardScore(patientAge, sequenciasA);
  const escorePadraoB = lookupTrilhasBStandardScore(patientAge, sequenciasB);
  const escorePadraoBA = lookupTrilhasBAStandardScore(patientAge, diferencaBA);

  const classificationA = escorePadraoA !== null ? getTrilhasClassification(escorePadraoA) : 'Não classificado';
  const classificationB = escorePadraoB !== null ? getTrilhasClassification(escorePadraoB) : 'Não classificado';
  const classificationBA = escorePadraoBA !== null ? getTrilhasClassification(escorePadraoBA) : 'Não classificado';

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {TRILHAS_TEST.fullName}
            <Badge variant="secondary" className="ml-2">
              {getTrilhasAgeGroupName(patientAge)}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {TRILHAS_TEST.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isValidAge && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O Teste de Trilhas é validado apenas para crianças de 6 a 14 anos. A idade atual ({patientAge} anos) está fora da faixa normativa.
            </AlertDescription>
          </Alert>
        )}

        {/* Entrada de dados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg border">
            <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Parte A
            </h4>
            <div className="space-y-2">
              <Label htmlFor="trilhas-seq-a" className="text-sm">
                Total de Sequências A
              </Label>
              <Input
                id="trilhas-seq-a"
                type="number"
                min={0}
                max={25}
                value={sequenciasA}
                onChange={(e) => setSequenciasA(Math.min(25, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Soma das sequências em letras e números
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg border">
            <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Parte B
            </h4>
            <div className="space-y-2">
              <Label htmlFor="trilhas-seq-b" className="text-sm">
                Total de Sequências B
              </Label>
              <Input
                id="trilhas-seq-b"
                type="number"
                min={0}
                max={24}
                value={sequenciasB}
                onChange={(e) => setSequenciasB(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Sequências com alternância letra-número
              </p>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Resultados
          </h4>
          
          {/* Sequências A */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-background rounded-lg border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Sequências A (Bruto)</p>
                <p className="text-xl font-bold">{sequenciasA}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Escore Padrão A</p>
                <p className="text-xl font-bold">
                  {escorePadraoA !== null ? escorePadraoA : '-'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Classificação A</p>
                <Badge 
                  variant="outline" 
                  className={`text-sm ${getTrilhasClassificationColor(classificationA)}`}
                >
                  {classificationA}
                </Badge>
              </div>
            </div>

            {/* Sequências B */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-background rounded-lg border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Sequências B (Bruto)</p>
                <p className="text-xl font-bold">{sequenciasB}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Escore Padrão B</p>
                <p className="text-xl font-bold">
                  {escorePadraoB !== null ? escorePadraoB : '-'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Classificação B</p>
                <Badge 
                  variant="outline" 
                  className={`text-sm ${getTrilhasClassificationColor(classificationB)}`}
                >
                  {classificationB}
                </Badge>
              </div>
            </div>

            {/* Diferença B-A */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-background rounded-lg border border-primary/30">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">B-A (Diferença)</p>
                <p className="text-xl font-bold">{diferencaBA}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Escore Padrão B-A</p>
                <p className="text-xl font-bold">
                  {escorePadraoBA !== null ? escorePadraoBA : '-'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Classificação B-A</p>
                <Badge 
                  variant="outline" 
                  className={`text-sm ${getTrilhasClassificationColor(classificationBA)}`}
                >
                  {classificationBA}
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Escore Padrão: M=100, DP=15
          </p>

          {/* Escala de classificação */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Escala de Classificação:</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="text-red-600 dark:text-red-400">&lt;70: Muito Baixa</Badge>
              <Badge variant="outline" className="text-orange-600 dark:text-orange-400">70-84: Baixa</Badge>
              <Badge variant="outline" className="text-gray-600 dark:text-gray-400">85-114: Média</Badge>
              <Badge variant="outline" className="text-blue-600 dark:text-blue-400">115-129: Alta</Badge>
              <Badge variant="outline" className="text-green-600 dark:text-green-400">≥130: Muito Alta</Badge>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="trilhas-notes" className="text-sm font-medium">
            Observações do Teste
          </Label>
          <Textarea
            id="trilhas-notes"
            placeholder="Comportamento durante o teste, dificuldades observadas, erros de alternância, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
