import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Brain, Calculator, Trash2 } from 'lucide-react';
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
import { lookupRAVLTPercentile, getAgeGroupName } from '@/data/neuroTests/ravltPercentiles';

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

  // Calcular resultados quando os scores mudam
  useEffect(() => {
    const escoreTotal = calculateEscoreTotal(scores.a1, scores.a2, scores.a3, scores.a4, scores.a5);
    const reconhecimento = calculateReconhecimento(scores.rec);
    const alt = calculateALT(escoreTotal, scores.a1);
    const velocidadeEsquecimento = calculateVelocidadeEsquecimento(scores.a7, scores.a6);
    const interferenciaProativa = calculateInterferenciaProativa(scores.b1, scores.a1);
    const interferenciaRetroativa = calculateInterferenciaRetroativa(scores.a6, scores.a5);

    // Buscar percentis
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
      reconhecimento: lookupRAVLTPercentile(patientAge, 'Reconhecimento', reconhecimento)
    };

    // Classificações
    const classifications = {
      a1: getRAVLTClassification(percentiles.a1),
      a2: getRAVLTClassification(percentiles.a2),
      a3: getRAVLTClassification(percentiles.a3),
      a4: getRAVLTClassification(percentiles.a4),
      a5: getRAVLTClassification(percentiles.a5),
      b1: getRAVLTClassification(percentiles.b1),
      a6: getRAVLTClassification(percentiles.a6),
      a7: getRAVLTClassification(percentiles.a7),
      escoreTotal: getRAVLTClassification(percentiles.escoreTotal),
      reconhecimento: getRAVLTClassification(percentiles.reconhecimento)
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

  // Percentis e classificações para exibição
  const escoreTotalPercentile = lookupRAVLTPercentile(patientAge, 'EscoreTotal', escoreTotal);
  const reconhecimentoPercentile = lookupRAVLTPercentile(patientAge, 'Reconhecimento', reconhecimento);

  const renderScoreInput = (
    field: keyof RAVLTScores, 
    label: string, 
    variableName: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'B1' | 'A6' | 'A7'
  ) => {
    const percentile = lookupRAVLTPercentile(patientAge, variableName, scores[field]);
    const classification = getRAVLTClassification(percentile);
    
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs sm:text-sm font-medium">{label}</Label>
          <Badge variant={getClassificationVariant(classification)} className="text-[9px] sm:text-[10px]">
            P{percentile}
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
                <Badge variant={getClassificationVariant(getRAVLTClassification(reconhecimentoPercentile))} className="text-[9px]">
                  P{reconhecimentoPercentile}
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
                <Badge variant={getClassificationVariant(getRAVLTClassification(escoreTotalPercentile))} className="text-[9px]">
                  P{escoreTotalPercentile} • {getRAVLTClassification(escoreTotalPercentile)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Outros cálculos */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted/30 rounded-lg">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">ALT (Aprendizagem)</Label>
              <p className="text-sm font-bold">{alt}</p>
              <p className="text-[9px] text-muted-foreground">Σ - (5 × A1)</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">Vel. Esquecimento</Label>
              <p className="text-sm font-bold">{velocidadeEsquecimento}</p>
              <p className="text-[9px] text-muted-foreground">A7 / A6</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">Int. Proativa</Label>
              <p className="text-sm font-bold">{interferenciaProativa}</p>
              <p className="text-[9px] text-muted-foreground">B1 / A1</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">Int. Retroativa</Label>
              <p className="text-sm font-bold">{interferenciaRetroativa}</p>
              <p className="text-[9px] text-muted-foreground">A6 / A5</p>
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
