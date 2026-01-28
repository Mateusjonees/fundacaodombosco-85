import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Brain, Calculator, Trash2, Info } from 'lucide-react';
import { 
  FDT_TEST, 
  calculateInibicao, 
  calculateFlexibilidade, 
  type FDTScores, 
  type FDTResults 
} from '@/data/neuroTests/fdt';
import {
  lookupFDTPercentile,
  getFDTClassification,
  getFDTClassificationColor,
  getFDTAgeGroupName
} from '@/data/neuroTests/fdtPercentiles';

interface NeuroTestFDTFormProps {
  patientAge: number;
  onResultsChange: (results: FDTResults) => void;
  onRemove: () => void;
}

export default function NeuroTestFDTForm({
  patientAge,
  onResultsChange,
  onRemove
}: NeuroTestFDTFormProps) {
  const [scores, setScores] = useState<FDTScores>({
    leitura: 0,
    contagem: 0,
    escolha: 0,
    alternancia: 0
  });
  const [notes, setNotes] = useState('');

  // Calcular resultados quando os scores mudam
  useEffect(() => {
    const inibicao = calculateInibicao(scores.escolha, scores.leitura);
    const flexibilidade = calculateFlexibilidade(scores.alternancia, scores.leitura);

    // Calcular percentis
    const percentilInibicao = lookupFDTPercentile(patientAge, 'inibicao', inibicao);
    const percentilFlexibilidade = lookupFDTPercentile(patientAge, 'flexibilidade', flexibilidade);

    const results: FDTResults = {
      rawScores: scores,
      calculatedScores: {
        inibicao,
        flexibilidade
      },
      percentiles: {
        inibicao: percentilInibicao,
        flexibilidade: percentilFlexibilidade
      },
      classifications: {
        inibicao: getFDTClassification(percentilInibicao),
        flexibilidade: getFDTClassification(percentilFlexibilidade)
      },
      notes
    };

    onResultsChange(results);
  }, [scores, notes, patientAge, onResultsChange]);

  const updateScore = (field: keyof FDTScores, value: string) => {
    const numValue = parseFloat(value) || 0;
    setScores(prev => ({
      ...prev,
      [field]: Math.max(0, numValue)
    }));
  };

  const inibicao = calculateInibicao(scores.escolha, scores.leitura);
  const flexibilidade = calculateFlexibilidade(scores.alternancia, scores.leitura);
  
  const percentilInibicao = lookupFDTPercentile(patientAge, 'inibicao', inibicao);
  const percentilFlexibilidade = lookupFDTPercentile(patientAge, 'flexibilidade', flexibilidade);
  
  const classInibicao = getFDTClassification(percentilInibicao);
  const classFlexibilidade = getFDTClassification(percentilFlexibilidade);

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
        {/* Campos de entrada (tempos em segundos) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Leitura (seg)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={scores.leitura || ''}
              onChange={(e) => updateScore('leitura', e.target.value)}
              className="h-9 text-sm"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Contagem (seg)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={scores.contagem || ''}
              onChange={(e) => updateScore('contagem', e.target.value)}
              className="h-9 text-sm"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Escolha (seg)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={scores.escolha || ''}
              onChange={(e) => updateScore('escolha', e.target.value)}
              className="h-9 text-sm"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Alternância (seg)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={scores.alternancia || ''}
              onChange={(e) => updateScore('alternancia', e.target.value)}
              className="h-9 text-sm"
              placeholder="0"
            />
          </div>
        </div>

        {/* Escores Calculados com Percentis e Classificações */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Inibição */}
          <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <Label className="font-medium text-xs sm:text-sm">Inibição</Label>
              </div>
              <span className="text-sm font-bold text-foreground">{inibicao.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Escolha - Leitura</p>
            <div className="flex items-center justify-between pt-1.5 border-t border-primary/10">
              <span className="text-xs text-muted-foreground">Percentil: {percentilInibicao}</span>
              <span className={`text-xs font-medium ${getFDTClassificationColor(classInibicao)}`}>
                {classInibicao}
              </span>
            </div>
          </div>
          
          {/* Flexibilidade */}
          <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <Label className="font-medium text-xs sm:text-sm">Flexibilidade</Label>
              </div>
              <span className="text-sm font-bold text-foreground">{flexibilidade.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Alternância - Leitura</p>
            <div className="flex items-center justify-between pt-1.5 border-t border-primary/10">
              <span className="text-xs text-muted-foreground">Percentil: {percentilFlexibilidade}</span>
              <span className={`text-xs font-medium ${getFDTClassificationColor(classFlexibilidade)}`}>
                {classFlexibilidade}
              </span>
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
