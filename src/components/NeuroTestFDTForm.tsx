import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Calculator, Trash2, Info, Clock, AlertTriangle } from 'lucide-react';
import { 
  FDT_TEST, 
  calculateInibicao, 
  calculateFlexibilidade, 
  type FDTScores, 
  type FDTResults 
} from '@/data/neuroTests/fdt';
import {
  lookupFDTPercentile,
  lookupFDTPercentileRange,
  getFDTClassification,
  getFDTClassificationColor,
  getFDTAgeGroupName,
  type FDTVariable
} from '@/data/neuroTests/fdtPercentiles';

interface NeuroTestFDTFormProps {
  patientAge: number;
  onResultsChange: (results: FDTResults) => void;
  onRemove: () => void;
}

/** Renderiza o badge de percentil + classificação */
const PercentilBadge = ({ variable, score, age }: { variable: FDTVariable; score: number; age: number }) => {
  const percentile = lookupFDTPercentile(age, variable, score);
  const range = lookupFDTPercentileRange(age, variable, score);
  const classification = getFDTClassification(percentile);
  const color = getFDTClassificationColor(classification);

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
        P{range}
      </Badge>
      <span className={`text-[10px] font-medium ${color}`}>
        {classification}
      </span>
    </div>
  );
};

export default function NeuroTestFDTForm({
  patientAge,
  onResultsChange,
  onRemove
}: NeuroTestFDTFormProps) {
  const [scores, setScores] = useState<FDTScores>({
    leitura: 0,
    contagem: 0,
    escolha: 0,
    alternancia: 0,
    errosLeitura: 0,
    errosContagem: 0,
    errosEscolha: 0,
    errosAlternancia: 0
  });
  const [notes, setNotes] = useState('');

  // Calcular resultados quando os scores mudam
  useEffect(() => {
    const inibicao = calculateInibicao(scores.escolha, scores.leitura);
    const flexibilidade = calculateFlexibilidade(scores.alternancia, scores.leitura);

    const allVars: { key: FDTVariable; value: number }[] = [
      { key: 'leitura', value: scores.leitura },
      { key: 'contagem', value: scores.contagem },
      { key: 'escolha', value: scores.escolha },
      { key: 'alternancia', value: scores.alternancia },
      { key: 'errosLeitura', value: scores.errosLeitura },
      { key: 'errosContagem', value: scores.errosContagem },
      { key: 'errosEscolha', value: scores.errosEscolha },
      { key: 'errosAlternancia', value: scores.errosAlternancia },
      { key: 'inibicao', value: inibicao },
      { key: 'flexibilidade', value: flexibilidade }
    ];

    const percentiles: Record<string, number> = {};
    const classifications: Record<string, string> = {};

    allVars.forEach(({ key, value }) => {
      const pct = lookupFDTPercentile(patientAge, key, value);
      percentiles[key] = pct;
      classifications[key] = getFDTClassification(pct);
    });

    const results: FDTResults = {
      rawScores: scores,
      calculatedScores: { inibicao, flexibilidade },
      percentiles: percentiles as any,
      classifications: classifications as any,
      notes
    };

    onResultsChange(results);
  }, [scores, notes, patientAge, onResultsChange]);

  const updateScore = (field: keyof FDTScores, value: string) => {
    const numValue = parseFloat(value) || 0;
    setScores(prev => ({ ...prev, [field]: Math.max(0, numValue) }));
  };

  const inibicao = calculateInibicao(scores.escolha, scores.leitura);
  const flexibilidade = calculateFlexibilidade(scores.alternancia, scores.leitura);

  // Campos de tempo
  const tempoFields: { key: keyof FDTScores; fdtVar: FDTVariable; label: string }[] = [
    { key: 'leitura', fdtVar: 'leitura', label: 'Leitura' },
    { key: 'contagem', fdtVar: 'contagem', label: 'Contagem' },
    { key: 'escolha', fdtVar: 'escolha', label: 'Escolha' },
    { key: 'alternancia', fdtVar: 'alternancia', label: 'Alternância' }
  ];

  // Campos de erros
  const erroFields: { key: keyof FDTScores; fdtVar: FDTVariable; label: string }[] = [
    { key: 'errosLeitura', fdtVar: 'errosLeitura', label: 'Leitura' },
    { key: 'errosContagem', fdtVar: 'errosContagem', label: 'Contagem' },
    { key: 'errosEscolha', fdtVar: 'errosEscolha', label: 'Escolha' },
    { key: 'errosAlternancia', fdtVar: 'errosAlternancia', label: 'Alternância' }
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {FDT_TEST.name} - {FDT_TEST.fullName}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-7 w-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {FDT_TEST.description}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          <Info className="h-3 w-3" />
          <span>Referência: {getFDTAgeGroupName(patientAge)} | Idade: {patientAge} anos</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {/* Tempos */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <Label className="text-xs font-semibold text-primary uppercase tracking-wide">Tempos (segundos)</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tempoFields.map(({ key, fdtVar, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs sm:text-sm">{label}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={scores[key] || ''}
                  onChange={(e) => updateScore(key, e.target.value)}
                  className="h-9 text-sm"
                  placeholder="0"
                />
                {scores[key] > 0 && (
                  <PercentilBadge variable={fdtVar} score={scores[key]} age={patientAge} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Erros */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <Label className="text-xs font-semibold text-destructive uppercase tracking-wide">Erros</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {erroFields.map(({ key, fdtVar, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs sm:text-sm">{label}</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={scores[key] || ''}
                  onChange={(e) => updateScore(key, e.target.value)}
                  className="h-9 text-sm"
                  placeholder="0"
                />
                {scores[key] > 0 && (
                  <PercentilBadge variable={fdtVar} score={scores[key]} age={patientAge} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Escores Calculados */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Calculator className="h-3.5 w-3.5 text-primary" />
            <Label className="text-xs font-semibold text-primary uppercase tracking-wide">Escores Calculados</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Inibição */}
            <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-1">
                <Label className="font-medium text-xs sm:text-sm">Inibição</Label>
                <span className="text-sm font-bold text-foreground">{inibicao.toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Escolha ({scores.escolha}) - Leitura ({scores.leitura})</p>
              {(scores.escolha > 0 || scores.leitura > 0) && (
                <div className="pt-1.5 border-t border-primary/10">
                  <PercentilBadge variable="inibicao" score={inibicao} age={patientAge} />
                </div>
              )}
            </div>
            
            {/* Flexibilidade */}
            <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-1">
                <Label className="font-medium text-xs sm:text-sm">Flexibilidade</Label>
                <span className="text-sm font-bold text-foreground">{flexibilidade.toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Alternância ({scores.alternancia}) - Leitura ({scores.leitura})</p>
              {(scores.alternancia > 0 || scores.leitura > 0) && (
                <div className="pt-1.5 border-t border-primary/10">
                  <PercentilBadge variable="flexibilidade" score={flexibilidade} age={patientAge} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-1">
          <Label className="text-xs">Obs. do Teste</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comportamento, dificuldades observadas..."
            className="min-h-[50px] resize-none text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
