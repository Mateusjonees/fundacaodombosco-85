import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Brain, Calculator, Trash2, AlertCircle } from 'lucide-react';
import { TIN_TEST, getTINClassification, getTINClassificationColor } from '@/data/neuroTests/tin';
import { lookupTINStandardScoreWithFallback, getTINAgeGroupName, isAgeValidForTIN } from '@/data/neuroTests/tinStandardScores';
import { epToPercentile, getPercentileFormula } from '@/utils/neuroPercentile';
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
  const [acertosStr, setAcertosStr] = useState('');
  const [notes, setNotes] = useState('');

  const isValidAge = isAgeValidForTIN(patientAge);

  // Converter string para número — aceitar qualquer valor, clampar para 0-60
  const rawParsed = acertosStr !== '' ? parseInt(acertosStr) : null;
  const isOutOfRange = rawParsed !== null && !isNaN(rawParsed) && (rawParsed < 0 || rawParsed > 60);
  const acertos = rawParsed !== null && !isNaN(rawParsed) ? Math.min(60, Math.max(0, rawParsed)) : null;

  // Calcular resultados quando os scores mudam
  const lookupResult = acertos !== null ? lookupTINStandardScoreWithFallback(patientAge, acertos) : null;
  const escorePadrao = lookupResult?.score ?? null;
  const lookupMethod = lookupResult?.method ?? null;
  const lookupDetail = lookupResult?.detail ?? null;
  const classification = escorePadrao !== null ? getTINClassification(escorePadrao) : 'Não classificado';
  const hasInput = acertos !== null;

  useEffect(() => {
    const results: TINResults = {
      rawScores: {
        acertos: acertos ?? 0
      },
      calculatedScores: {
        escorePadrao
      },
      percentiles: escorePadrao !== null ? { escorePadrao: epToPercentile(escorePadrao) } : {},
      classifications: {
        escorePadrao: classification
      },
      notes
    };

    onResultsChange(results);
  }, [acertos, notes, patientAge, onResultsChange, escorePadrao, classification]);

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
                value={acertosStr}
                onChange={(e) => setAcertosStr(e.target.value)}
                placeholder="0-60"
                className="w-32"
              />
              {isOutOfRange && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  ⚠ Valor digitado ({rawParsed}) fora do intervalo 0-60 — corrigido automaticamente para <strong>{acertos}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className={`p-4 rounded-lg border ${
          !hasInput 
            ? 'bg-muted/10 border-muted/30' 
            : escorePadrao !== null 
              ? 'bg-primary/5 border-primary/20' 
              : 'bg-destructive/5 border-destructive/20'
        }`}>
          <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Resultados
            {!hasInput && (
              <Badge variant="outline" className="text-muted-foreground text-[10px] ml-auto">
                Aguardando entrada
              </Badge>
            )}
            {hasInput && escorePadrao !== null && (
              <Badge variant="outline" className="text-green-600 dark:text-green-400 text-[10px] ml-auto border-green-300 dark:border-green-700">
                ✓ Norma encontrada
              </Badge>
            )}
            {hasInput && escorePadrao === null && (
              <Badge variant="destructive" className="text-[10px] ml-auto">
                ✗ Sem norma disponível
              </Badge>
            )}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`text-center p-3 rounded-lg border ${!hasInput ? 'bg-muted/20 border-dashed' : 'bg-background'}`}>
              <p className="text-xs text-muted-foreground mb-1">Escore Bruto</p>
              <p className={`text-2xl font-bold ${!hasInput ? 'text-muted-foreground/40' : ''}`}>{hasInput ? acertos : '-'}</p>
            </div>
            
            <div className={`text-center p-3 rounded-lg border ${
              !hasInput ? 'bg-muted/20 border-dashed' 
              : escorePadrao !== null ? 'bg-background' 
              : 'bg-destructive/5 border-destructive/30'
            }`}>
              <p className="text-xs text-muted-foreground mb-1">Escore Padrão</p>
              <p className={`text-2xl font-bold ${
                !hasInput ? 'text-muted-foreground/40' 
                : escorePadrao === null ? 'text-destructive' : ''
              }`}>
                {escorePadrao !== null ? escorePadrao : (hasInput ? '—' : '-')}
              </p>
              <p className="text-xs text-muted-foreground">
                (M=100, DP=15)
              </p>
              {hasInput && lookupMethod && lookupMethod !== 'exact' && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  ≈ {lookupMethod === 'interpolated' ? 'Interpolado' : lookupMethod === 'nearest_age' ? 'Idade próxima' : 'Extrapolado'}
                </p>
              )}
              {hasInput && lookupDetail && lookupMethod !== 'exact' && (
                <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                  {lookupDetail}
                </p>
              )}
              {hasInput && escorePadrao === null && (
                <div className="text-[10px] text-destructive mt-1 space-y-0.5">
                  <p>Sem norma para esta combinação</p>
                  <p className="font-mono text-[9px] text-destructive/70">
                    idade={Math.floor(patientAge)}, bruto={acertos}
                  </p>
                </div>
              )}
            </div>
            
            <div className={`text-center p-3 rounded-lg border ${
              !hasInput ? 'bg-muted/20 border-dashed' 
              : escorePadrao === null ? 'bg-destructive/5 border-destructive/30' : 'bg-background'
            }`}>
              <p className="text-xs text-muted-foreground mb-1">Classificação</p>
              {escorePadrao !== null ? (
                <Badge 
                  variant="outline" 
                  className={`text-sm ${getTINClassificationColor(classification)}`}
                >
                  {classification}
                </Badge>
              ) : (
                <p className={`text-sm ${hasInput ? 'text-destructive' : 'text-muted-foreground/40'}`}>{hasInput ? '—' : '-'}</p>
              )}
            </div>

            <div className={`text-center p-3 rounded-lg border ${
              !hasInput ? 'bg-muted/20 border-dashed' 
              : escorePadrao !== null ? 'border-primary/30 bg-background' 
              : 'bg-destructive/5 border-destructive/30'
            }`}>
              <p className="text-xs text-muted-foreground mb-1">Percentil</p>
              <p className={`text-2xl font-bold ${
                !hasInput ? 'text-muted-foreground/40' 
                : escorePadrao !== null ? 'text-primary' : 'text-destructive'
              }`}>
                {escorePadrao !== null ? epToPercentile(escorePadrao) : (hasInput ? '—' : '-')}
              </p>
              {escorePadrao !== null && (
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                  {getPercentileFormula('ep', escorePadrao)}
                </p>
              )}
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
