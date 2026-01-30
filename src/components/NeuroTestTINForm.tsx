import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Brain, Calculator, Trash2, AlertCircle } from 'lucide-react';
import { TIN_TEST, getTINClassification, getTINClassificationColor } from '@/data/neuroTests/tin';
import { lookupTINStandardScore, getTINAgeGroupName, isAgeValidForTIN } from '@/data/neuroTests/tinStandardScores';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface TINResults {
  rawScores: {
    acertos: number;
  };
  calculatedScores: {
    escorePadrao: number | null;
  };
  percentiles: Record<string, number>;
  classifications: {
    escorePadrao: string;
  };
  notes: string;
}

interface NeuroTestTINFormProps {
  patientAge: number;
  onResultsChange: (results: TINResults) => void;
  onRemove: () => void;
}

export default function NeuroTestTINForm({
  patientAge,
  onResultsChange,
  onRemove
}: NeuroTestTINFormProps) {
  const [acertos, setAcertos] = useState(0);
  const [notes, setNotes] = useState('');

  const isValidAge = isAgeValidForTIN(patientAge);

  // Calcular resultados quando os scores mudam
  useEffect(() => {
    const escorePadrao = lookupTINStandardScore(patientAge, acertos);
    
    const results: TINResults = {
      rawScores: {
        acertos
      },
      calculatedScores: {
        escorePadrao
      },
      percentiles: {}, // TIN não usa percentil, usa escore padrão
      classifications: {
        escorePadrao: escorePadrao !== null ? getTINClassification(escorePadrao) : 'Não classificado'
      },
      notes
    };

    onResultsChange(results);
  }, [acertos, notes, patientAge, onResultsChange]);

  const escorePadrao = lookupTINStandardScore(patientAge, acertos);
  const classification = escorePadrao !== null ? getTINClassification(escorePadrao) : 'Não classificado';

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {TIN_TEST.fullName}
            <Badge variant="secondary" className="ml-2">
              {getTINAgeGroupName(patientAge)}
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
          {TIN_TEST.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isValidAge && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O TIN é validado apenas para crianças de 3 a 14 anos. A idade atual ({patientAge} anos) está fora da faixa normativa.
            </AlertDescription>
          </Alert>
        )}

        {/* Entrada de dados */}
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg border">
            <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Total de Acertos
            </h4>
            <div className="space-y-2">
              <Label htmlFor="tin-acertos" className="text-sm">
                Número de itens nomeados corretamente (0-60)
              </Label>
              <Input
                id="tin-acertos"
                type="number"
                min={0}
                max={60}
                value={acertos}
                onChange={(e) => setAcertos(Math.min(60, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-32"
              />
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Resultados
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Escore Bruto</p>
              <p className="text-2xl font-bold">{acertos}</p>
            </div>
            
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Escore Padrão</p>
              <p className="text-2xl font-bold">
                {escorePadrao !== null ? escorePadrao : '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                (M=100, DP=15)
              </p>
            </div>
            
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Classificação</p>
              <Badge 
                variant="outline" 
                className={`text-sm ${getTINClassificationColor(classification)}`}
              >
                {classification}
              </Badge>
            </div>
          </div>

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
          <Label htmlFor="tin-notes" className="text-sm font-medium">
            Observações do Teste
          </Label>
          <Textarea
            id="tin-notes"
            placeholder="Comportamento durante o teste, dificuldades observadas, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
