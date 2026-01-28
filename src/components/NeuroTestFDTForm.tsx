import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Brain, Calculator, Trash2 } from 'lucide-react';
import { FDT_TEST, calculateInibicao, calculateFlexibilidade, type FDTScores, type FDTResults } from '@/data/neuroTests/fdt';

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

    const results: FDTResults = {
      rawScores: scores,
      calculatedScores: {
        inibicao,
        flexibilidade
      },
      notes
    };

    onResultsChange(results);
  }, [scores, notes, onResultsChange]);

  const updateScore = (field: keyof FDTScores, value: string) => {
    const numValue = parseFloat(value) || 0;
    setScores(prev => ({
      ...prev,
      [field]: Math.max(0, numValue)
    }));
  };

  const inibicao = calculateInibicao(scores.escolha, scores.leitura);
  const flexibilidade = calculateFlexibilidade(scores.alternancia, scores.leitura);

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

        {/* Escores Calculados */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <Label className="font-medium text-xs sm:text-sm">Inibição</Label>
              </div>
              <span className="text-sm font-bold text-foreground">{inibicao.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Escolha - Leitura</p>
          </div>
          
          <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <Label className="font-medium text-xs sm:text-sm">Flexibilidade</Label>
              </div>
              <span className="text-sm font-bold text-foreground">{flexibilidade.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Alternância - Leitura</p>
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
