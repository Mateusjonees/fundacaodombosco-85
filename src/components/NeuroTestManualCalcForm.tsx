import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, X, BarChart3, TrendingUp } from 'lucide-react';

export interface ManualCalcResults {
  testCode: string;
  testName: string;
  type: 'percentile' | 'zscore';
  rawInputs: Record<string, string | number>;
  result: number | string;
  classification: string;
}

interface NeuroTestManualCalcFormProps {
  testCode: string;
  testName: string;
  onResultsChange: (results: ManualCalcResults | null) => void;
  onRemove: () => void;
}

// Definição dos testes e seus tipos
const TEST_CONFIGS: Record<string, { type: 'percentile' | 'zscore'; displayName: string }> = {
  // Percentil
  'CALC_FVA': { type: 'percentile', displayName: 'FVA (Cálculo Manual)' },
  'CALC_TFV': { type: 'percentile', displayName: 'TFV (Cálculo Manual)' },
  'CALC_TMT': { type: 'percentile', displayName: 'TMT (Cálculo Manual)' },
  'CALC_FPT_ADULTO': { type: 'percentile', displayName: 'FPT Adulto (Cálculo Manual)' },
  'CALC_HAYLING_INFANTIL': { type: 'percentile', displayName: 'Hayling Infantil (Cálculo Manual)' },
  // Z-Score
  'CALC_BNTBR': { type: 'zscore', displayName: 'BNT-BR (Cálculo Manual)' },
  'CALC_SPAN_DIGITOS': { type: 'zscore', displayName: 'Span de Dígitos (Cálculo Manual)' },
  'CALC_CUBOS_CORSI': { type: 'zscore', displayName: 'Cubos de Corsi (Cálculo Manual)' },
  'CALC_HAYLING_ADULTO': { type: 'zscore', displayName: 'Hayling Adulto (Cálculo Manual)' },
  'CALC_TAYLOR': { type: 'zscore', displayName: 'Taylor (Cálculo Manual)' },
  'CALC_TOM': { type: 'zscore', displayName: 'TOM (Cálculo Manual)' },
  'CALC_FAS': { type: 'zscore', displayName: 'FAS (Cálculo Manual)' },
};

// Classificação por percentil
const getPercentileClassification = (percentile: number | string): string => {
  const p = typeof percentile === 'string' ? percentile : String(percentile);
  const numericPercentile = typeof percentile === 'number' ? percentile : parseFloat(percentile);
  
  if (p === '<5' || p === '5' || (!isNaN(numericPercentile) && numericPercentile <= 5)) return 'Inferior';
  if (p === '5-25' || p === '25' || (!isNaN(numericPercentile) && numericPercentile > 5 && numericPercentile <= 25)) return 'Média Inferior';
  if (p === '25-50' || p === '50' || p === '50-75' || (!isNaN(numericPercentile) && numericPercentile > 25 && numericPercentile <= 75)) return 'Média';
  if (p === '75' || p === '75-95' || (!isNaN(numericPercentile) && numericPercentile > 75 && numericPercentile < 95)) return 'Média Superior';
  if (p === '95' || p === '>95' || (!isNaN(numericPercentile) && numericPercentile >= 95)) return 'Superior';
  
  return 'Média';
};

// Classificação por Z-Score
const getZScoreClassification = (zScore: number): string => {
  if (zScore >= 1.37) return 'Superior';
  if (zScore >= 0.66 && zScore <= 1.36) return 'Médio Superior';
  if (zScore >= -0.69 && zScore <= 0.65) return 'Médio';
  if (zScore >= -1.31 && zScore <= -0.70) return 'Médio Inferior';
  if (zScore <= -1.32) return 'Inferior';
  return 'Médio';
};

// Badge variant por classificação
const getClassificationVariant = (classification: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (classification.includes('Inferior') && !classification.includes('Média')) return 'destructive';
  if (classification === 'Média Inferior') return 'outline';
  if (classification.includes('Superior') && !classification.includes('Média')) return 'default';
  return 'secondary';
};

export default function NeuroTestManualCalcForm({
  testCode,
  testName,
  onResultsChange,
  onRemove
}: NeuroTestManualCalcFormProps) {
  const config = TEST_CONFIGS[testCode];
  const isPercentile = config?.type === 'percentile';
  
  // Estado para Percentil
  const [percentileType, setPercentileType] = useState<'exact' | 'range'>('exact');
  const [exactPercentile, setExactPercentile] = useState('');
  const [rangePercentile, setRangePercentile] = useState('');
  
  // Estado para Z-Score
  const [rawScore, setRawScore] = useState('');
  const [mean, setMean] = useState('');
  const [standardDeviation, setStandardDeviation] = useState('');
  
  // Resultado calculado
  const [result, setResult] = useState<{ value: number | string; classification: string } | null>(null);

  // Calcular automaticamente quando os valores mudam
  const calculatePercentile = useCallback(() => {
    let percentile: string;
    if (percentileType === 'exact') {
      if (!exactPercentile) return null;
      percentile = exactPercentile;
    } else {
      if (!rangePercentile) return null;
      percentile = rangePercentile;
    }
    
    const classification = getPercentileClassification(
      percentileType === 'exact' ? parseFloat(percentile) : percentile
    );
    
    return { value: percentile, classification };
  }, [percentileType, exactPercentile, rangePercentile]);

  const calculateZScore = useCallback(() => {
    const score = parseFloat(rawScore);
    const m = parseFloat(mean);
    const sd = parseFloat(standardDeviation);
    
    if (isNaN(score) || isNaN(m) || isNaN(sd) || sd === 0) return null;
    
    const zScore = Math.round(((score - m) / sd) * 100) / 100;
    const classification = getZScoreClassification(zScore);
    
    return { value: zScore, classification };
  }, [rawScore, mean, standardDeviation]);

  // Atualizar resultado e notificar pai
  useEffect(() => {
    const newResult = isPercentile ? calculatePercentile() : calculateZScore();
    setResult(newResult);
    
    if (newResult) {
      const rawInputs = isPercentile 
        ? { percentileType, percentile: percentileType === 'exact' ? exactPercentile : rangePercentile }
        : { pontuacao: parseFloat(rawScore), media: parseFloat(mean), desvioPadrao: parseFloat(standardDeviation) };
      
      onResultsChange({
        testCode,
        testName: config?.displayName || testName,
        type: isPercentile ? 'percentile' : 'zscore',
        rawInputs,
        result: newResult.value,
        classification: newResult.classification
      });
    } else {
      onResultsChange(null);
    }
  }, [isPercentile, calculatePercentile, calculateZScore, testCode, testName, config, onResultsChange,
      percentileType, exactPercentile, rangePercentile, rawScore, mean, standardDeviation]);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPercentile ? (
              <BarChart3 className="h-4 w-4 text-primary" />
            ) : (
              <TrendingUp className="h-4 w-4 text-primary" />
            )}
            <span>{config?.displayName || testName}</span>
            <Badge variant="outline" className="text-xs">
              {isPercentile ? 'Percentil' : 'Z-Score'}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPercentile ? (
          <>
            {/* Formulário Percentil */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={percentileType} onValueChange={(v) => setPercentileType(v as 'exact' | 'range')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Percentil Exato</SelectItem>
                    <SelectItem value="range">Faixa Percentílica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {percentileType === 'exact' ? (
                <div className="space-y-1">
                  <Label className="text-xs">Percentil</Label>
                  <Select value={exactPercentile} onValueChange={setExactPercentile}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="75">75</SelectItem>
                      <SelectItem value="95">95</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs">Faixa</Label>
                  <Select value={rangePercentile} onValueChange={setRangePercentile}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<5">&lt;5</SelectItem>
                      <SelectItem value="5-25">5-25</SelectItem>
                      <SelectItem value="25-50">25-50</SelectItem>
                      <SelectItem value="50-75">50-75</SelectItem>
                      <SelectItem value="75-95">75-95</SelectItem>
                      <SelectItem value=">95">&gt;95</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Formulário Z-Score */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Pontuação</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={rawScore}
                  onChange={(e) => setRawScore(e.target.value)}
                  placeholder="Bruto"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Média (M)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={mean}
                  onChange={(e) => setMean(e.target.value)}
                  placeholder="Média"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">DP</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={standardDeviation}
                  onChange={(e) => setStandardDeviation(e.target.value)}
                  placeholder="Desvio"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </>
        )}

        {/* Resultado */}
        {result && (
          <div className="flex items-center justify-between p-2 bg-background rounded-md border">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {isPercentile ? `Percentil: ${result.value}` : `Z-Score: ${result.value}`}
              </span>
            </div>
            <Badge variant={getClassificationVariant(result.classification)}>
              {result.classification}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
