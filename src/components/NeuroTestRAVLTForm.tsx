import { useState, useEffect, useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Brain, Calculator, Trash2, Info, ChevronDown } from 'lucide-react';
import { 
  RAVLT_TEST, 
  calculateReconhecimento,
  calculateEscoreTotal,
  calculateALT,
  calculateVelocidadeEsquecimento,
  calculateInterferenciaProativa,
  calculateInterferenciaRetroativa,
  getRAVLTClassification,
  type RAVLTScores, 
  type RAVLTResults 
} from '@/data/neuroTests/ravlt';
import { lookupRAVLTPercentile, lookupRAVLTPercentileRange, getClassificationFromRange, getAgeGroupName } from '@/data/neuroTests/ravltPercentiles';

interface NeuroTestRAVLTFormProps {
  patientAge: number;
  onResultsChange: (results: RAVLTResults) => void;
  onRemove: () => void;
}

function getClassificationVariant(classification: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (classification.includes('Inferior')) return 'destructive';
  if (classification.includes('Superior')) return 'default';
  return 'secondary';
}

export default function NeuroTestRAVLTForm({
  patientAge,
  onResultsChange,
  onRemove
}: NeuroTestRAVLTFormProps) {
  const [scores, setScores] = useState<RAVLTScores>({
    a1: 0, a2: 0, a3: 0, a4: 0, a5: 0,
    b1: 0, a6: 0, a7: 0, rec: 0
  });
  const [notes, setNotes] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  // Calcular resultados quando os scores mudam
  useEffect(() => {
    const escoreTotal = calculateEscoreTotal(scores.a1, scores.a2, scores.a3, scores.a4, scores.a5);
    const reconhecimento = calculateReconhecimento(scores.rec);
    const alt = calculateALT(escoreTotal, scores.a1);
    const velocidadeEsquecimento = calculateVelocidadeEsquecimento(scores.a7, scores.a6);
    const interferenciaProativa = calculateInterferenciaProativa(scores.b1, scores.a1);
    const interferenciaRetroativa = calculateInterferenciaRetroativa(scores.a6, scores.a5);

    // Buscar percentis (numéricos para armazenamento)
    const percentiles = {
      a1: lookupRAVLTPercentile(patientAge, 'A1', scores.a1),
      a2: lookupRAVLTPercentile(patientAge, 'A2', scores.a2),
      a3: lookupRAVLTPercentile(patientAge, 'A3', scores.a3),
      a4: lookupRAVLTPercentile(patientAge, 'A4', scores.a4),
      a5: lookupRAVLTPercentile(patientAge, 'A5', scores.a5),
      b1: lookupRAVLTPercentile(patientAge, 'B1', scores.b1),
      a6: lookupRAVLTPercentile(patientAge, 'A6', scores.a6),
      a7: lookupRAVLTPercentile(patientAge, 'A7', scores.a7),
      escoreTotal: lookupRAVLTPercentile(patientAge, 'EscoreTotal', escoreTotal),
      reconhecimento: lookupRAVLTPercentile(patientAge, 'Reconhecimento', reconhecimento),
      alt: lookupRAVLTPercentile(patientAge, 'ALT', alt),
      velocidadeEsquecimento: lookupRAVLTPercentile(patientAge, 'VelocidadeEsquecimento', velocidadeEsquecimento),
      interferenciaProativa: lookupRAVLTPercentile(patientAge, 'InterferenciaProativa', interferenciaProativa),
      interferenciaRetroativa: lookupRAVLTPercentile(patientAge, 'InterferenciaRetroativa', interferenciaRetroativa)
    };

    // Buscar faixas percentílicas (strings para exibição)
    const percentileRanges = {
      a1: lookupRAVLTPercentileRange(patientAge, 'A1', scores.a1),
      a2: lookupRAVLTPercentileRange(patientAge, 'A2', scores.a2),
      a3: lookupRAVLTPercentileRange(patientAge, 'A3', scores.a3),
      a4: lookupRAVLTPercentileRange(patientAge, 'A4', scores.a4),
      a5: lookupRAVLTPercentileRange(patientAge, 'A5', scores.a5),
      b1: lookupRAVLTPercentileRange(patientAge, 'B1', scores.b1),
      a6: lookupRAVLTPercentileRange(patientAge, 'A6', scores.a6),
      a7: lookupRAVLTPercentileRange(patientAge, 'A7', scores.a7),
      escoreTotal: lookupRAVLTPercentileRange(patientAge, 'EscoreTotal', escoreTotal),
      reconhecimento: lookupRAVLTPercentileRange(patientAge, 'Reconhecimento', reconhecimento),
      alt: lookupRAVLTPercentileRange(patientAge, 'ALT', alt),
      velocidadeEsquecimento: lookupRAVLTPercentileRange(patientAge, 'VelocidadeEsquecimento', velocidadeEsquecimento),
      interferenciaProativa: lookupRAVLTPercentileRange(patientAge, 'InterferenciaProativa', interferenciaProativa),
      interferenciaRetroativa: lookupRAVLTPercentileRange(patientAge, 'InterferenciaRetroativa', interferenciaRetroativa)
    };

    // Classificações usando faixas percentílicas
    const classifications = {
      a1: getClassificationFromRange(percentileRanges.a1),
      a2: getClassificationFromRange(percentileRanges.a2),
      a3: getClassificationFromRange(percentileRanges.a3),
      a4: getClassificationFromRange(percentileRanges.a4),
      a5: getClassificationFromRange(percentileRanges.a5),
      b1: getClassificationFromRange(percentileRanges.b1),
      a6: getClassificationFromRange(percentileRanges.a6),
      a7: getClassificationFromRange(percentileRanges.a7),
      escoreTotal: getClassificationFromRange(percentileRanges.escoreTotal),
      reconhecimento: getClassificationFromRange(percentileRanges.reconhecimento),
      alt: getClassificationFromRange(percentileRanges.alt),
      velocidadeEsquecimento: getClassificationFromRange(percentileRanges.velocidadeEsquecimento),
      interferenciaProativa: getClassificationFromRange(percentileRanges.interferenciaProativa),
      interferenciaRetroativa: getClassificationFromRange(percentileRanges.interferenciaRetroativa)
    };

    const results: RAVLTResults = {
      rawScores: scores,
      calculatedScores: {
        reconhecimento,
        escoreTotal,
        alt,
        velocidadeEsquecimento,
        interferenciaProativa,
        interferenciaRetroativa
      },
      percentiles,
      percentileRanges,
      classifications,
      notes
    };

    onResultsChange(results);
  }, [scores, notes, patientAge, onResultsChange]);

  const updateScore = (field: keyof RAVLTScores, value: string) => {
    const numValue = parseInt(value) || 0;
    setScores(prev => ({
      ...prev,
      [field]: Math.max(0, numValue)
    }));
  };

  // Calcular valores para exibição
  const escoreTotal = calculateEscoreTotal(scores.a1, scores.a2, scores.a3, scores.a4, scores.a5);
  const reconhecimento = calculateReconhecimento(scores.rec);
  const alt = calculateALT(escoreTotal, scores.a1);
  const velocidadeEsquecimento = calculateVelocidadeEsquecimento(scores.a7, scores.a6);
  const interferenciaProativa = calculateInterferenciaProativa(scores.b1, scores.a1);
  const interferenciaRetroativa = calculateInterferenciaRetroativa(scores.a6, scores.a5);

  // Faixas percentílicas para exibição
  const escoreTotalRange = lookupRAVLTPercentileRange(patientAge, 'EscoreTotal', escoreTotal);
  const reconhecimentoRange = lookupRAVLTPercentileRange(patientAge, 'Reconhecimento', reconhecimento);
  const altRange = lookupRAVLTPercentileRange(patientAge, 'ALT', alt);
  const veRange = lookupRAVLTPercentileRange(patientAge, 'VelocidadeEsquecimento', velocidadeEsquecimento);
  const ipRange = lookupRAVLTPercentileRange(patientAge, 'InterferenciaProativa', interferenciaProativa);
  const irRange = lookupRAVLTPercentileRange(patientAge, 'InterferenciaRetroativa', interferenciaRetroativa);

  const renderScoreInput = (
    field: keyof RAVLTScores, 
    label: string, 
    variableName: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'B1' | 'A6' | 'A7'
  ) => {
    const percentileRange = lookupRAVLTPercentileRange(patientAge, variableName, scores[field]);
    const classification = getClassificationFromRange(percentileRange);
    
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs sm:text-sm font-medium">{label}</Label>
          <Badge variant={getClassificationVariant(classification)} className="text-[9px] sm:text-[10px]">
            P{percentileRange}
          </Badge>
        </div>
        <Input
          type="number"
          min="0"
          max="15"
          value={scores[field] || ''}
          onChange={(e) => updateScore(field, e.target.value)}
          className="h-8 text-sm"
          placeholder="0"
        />
      </div>
    );
  };

  const renderCalcCard = (
    label: string,
    value: number | string,
    formula: string,
    variableName: 'ALT' | 'VelocidadeEsquecimento' | 'InterferenciaProativa' | 'InterferenciaRetroativa',
    rawValue: number
  ) => {
    const range = lookupRAVLTPercentileRange(patientAge, variableName, rawValue);
    const classification = getClassificationFromRange(range);

    return (
      <div className="p-2 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-0.5">
          <Label className="text-[10px] sm:text-xs text-muted-foreground">{label}</Label>
        </div>
        <p className="text-sm font-bold">{value}</p>
        <p className="text-[9px] text-muted-foreground">{formula}</p>
        <Badge variant={getClassificationVariant(classification)} className="text-[9px] mt-1">
          P{range} • {classification}
        </Badge>
      </div>
    );
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {RAVLT_TEST.name}
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
          {RAVLT_TEST.fullName} • Tabela: {getAgeGroupName(patientAge)}
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {/* Instruções */}
        <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline w-full">
              <Info className="h-3 w-3" />
              <span>Instruções de aplicação</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showInstructions ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-2.5 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1">
              <p>• <strong>A1-A5</strong>: Leia a lista A (15 palavras) e peça para o paciente repetir. Repita 5 vezes.</p>
              <p>• <strong>B1</strong>: Leia a lista B (interferência) uma vez e peça para repetir.</p>
              <p>• <strong>A6</strong>: Sem reler a lista A, peça para o paciente recordar as palavras da lista A.</p>
              <p>• <strong>A7</strong>: Após 20-30 minutos, peça novamente para recordar a lista A.</p>
              <p>• <strong>Reconhecimento</strong>: Apresente lista com 50 palavras (15 da lista A + 35 distratores). Registre quantas o paciente marcou.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Tentativas de aprendizagem A1-A5 */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">Tentativas de Aprendizagem</Label>
          <div className="grid grid-cols-5 gap-2">
            {renderScoreInput('a1', 'A1', 'A1')}
            {renderScoreInput('a2', 'A2', 'A2')}
            {renderScoreInput('a3', 'A3', 'A3')}
            {renderScoreInput('a4', 'A4', 'A4')}
            {renderScoreInput('a5', 'A5', 'A5')}
          </div>
        </div>

        {/* Lista B e Evocações */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">Lista B e Evocações</Label>
          <div className="grid grid-cols-3 gap-2">
            {renderScoreInput('b1', 'B1', 'B1')}
            {renderScoreInput('a6', 'A6', 'A6')}
            {renderScoreInput('a7', 'A7', 'A7')}
          </div>
        </div>

        {/* Reconhecimento */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">Reconhecimento</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs sm:text-sm">REC (antes de -35)</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={scores.rec || ''}
                onChange={(e) => updateScore('rec', e.target.value)}
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
            <div className="p-2 bg-muted/30 rounded-lg flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Reconhecimento</span>
                <Badge variant={getClassificationVariant(getClassificationFromRange(reconhecimentoRange))} className="text-[9px]">
                  P{reconhecimentoRange}
                </Badge>
              </div>
              <span className="text-sm font-bold">{reconhecimento}</span>
            </div>
          </div>
        </div>

        {/* Escores Calculados */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Calculator className="h-3 w-3" />
            Escores Calculados
          </Label>
          
          {/* Escore Total */}
          <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-xs sm:text-sm">Escore Total (Σ A1-A5)</Label>
                <p className="text-[10px] text-muted-foreground">A1 + A2 + A3 + A4 + A5</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{escoreTotal}</span>
                <Badge variant={getClassificationVariant(getClassificationFromRange(escoreTotalRange))} className="text-[9px]">
                  P{escoreTotalRange} • {getClassificationFromRange(escoreTotalRange)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Reconhecimento calculado */}
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Reconhecimento (REC - 35)</Label>
                <p className="text-sm font-bold">{reconhecimento}</p>
              </div>
              <Badge variant={getClassificationVariant(getClassificationFromRange(reconhecimentoRange))} className="text-[9px]">
                P{reconhecimentoRange} • {getClassificationFromRange(reconhecimentoRange)}
              </Badge>
            </div>
          </div>

          {/* Outros cálculos com percentil individual */}
          <div className="grid grid-cols-2 gap-2">
            {renderCalcCard('ALT (Aprendizagem)', alt, 'Σ - (5 × A1)', 'ALT', alt)}
            {renderCalcCard('Vel. Esquecimento', velocidadeEsquecimento, 'A7 / A6', 'VelocidadeEsquecimento', velocidadeEsquecimento)}
            {renderCalcCard('Int. Proativa', interferenciaProativa, 'B1 / A1', 'InterferenciaProativa', interferenciaProativa)}
            {renderCalcCard('Int. Retroativa', interferenciaRetroativa, 'A6 / A5', 'InterferenciaRetroativa', interferenciaRetroativa)}
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
