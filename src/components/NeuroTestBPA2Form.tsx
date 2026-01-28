import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Brain, Calculator, Trash2 } from 'lucide-react';
import { 
  BPA2_TEST, 
  calculateSubtestScore, 
  calculateAG, 
  getClassification 
} from '@/data/neuroTests/bpa2';
import { lookupPercentile } from '@/data/neuroTests/bpa2Percentiles';

export interface BPA2Scores {
  ac: { acertos: number; erros: number; omissoes: number };
  ad: { acertos: number; erros: number; omissoes: number };
  aa: { acertos: number; erros: number; omissoes: number };
}

export interface BPA2Results {
  rawScores: BPA2Scores;
  calculatedScores: {
    AC: number;
    AD: number;
    AA: number;
    AG: number;
  };
  percentiles: {
    AC: number;
    AD: number;
    AA: number;
    AG: number;
  };
  classifications: {
    AC: string;
    AD: string;
    AA: string;
    AG: string;
  };
  notes: string;
}

interface NeuroTestBPA2FormProps {
  patientAge: number;
  onResultsChange: (results: BPA2Results) => void;
  onRemove: () => void;
}

export default function NeuroTestBPA2Form({
  patientAge,
  onResultsChange,
  onRemove
}: NeuroTestBPA2FormProps) {
  const [scores, setScores] = useState<BPA2Scores>({
    ac: { acertos: 0, erros: 0, omissoes: 0 },
    ad: { acertos: 0, erros: 0, omissoes: 0 },
    aa: { acertos: 0, erros: 0, omissoes: 0 }
  });
  const [notes, setNotes] = useState('');

  // Calcular resultados quando os scores mudam
  useEffect(() => {
    const acScore = calculateSubtestScore(scores.ac.acertos, scores.ac.erros, scores.ac.omissoes);
    const adScore = calculateSubtestScore(scores.ad.acertos, scores.ad.erros, scores.ad.omissoes);
    const aaScore = calculateSubtestScore(scores.aa.acertos, scores.aa.erros, scores.aa.omissoes);
    const agScore = calculateAG(acScore, adScore, aaScore);

    const acPercentile = lookupPercentile(patientAge, 'AC', acScore);
    const adPercentile = lookupPercentile(patientAge, 'AD', adScore);
    const aaPercentile = lookupPercentile(patientAge, 'AA', aaScore);
    const agPercentile = lookupPercentile(patientAge, 'AG', agScore);

    const results: BPA2Results = {
      rawScores: scores,
      calculatedScores: {
        AC: acScore,
        AD: adScore,
        AA: aaScore,
        AG: agScore
      },
      percentiles: {
        AC: acPercentile,
        AD: adPercentile,
        AA: aaPercentile,
        AG: agPercentile
      },
      classifications: {
        AC: getClassification(acPercentile),
        AD: getClassification(adPercentile),
        AA: getClassification(aaPercentile),
        AG: getClassification(agPercentile)
      },
      notes
    };

    onResultsChange(results);
  }, [scores, notes, patientAge, onResultsChange]);

  const updateScore = (
    subtest: 'ac' | 'ad' | 'aa',
    field: 'acertos' | 'erros' | 'omissoes',
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setScores(prev => ({
      ...prev,
      [subtest]: {
        ...prev[subtest],
        [field]: Math.max(0, numValue)
      }
    }));
  };

  const renderSubtestRow = (
    code: 'AC' | 'AD' | 'AA',
    name: string,
    subtestKey: 'ac' | 'ad' | 'aa'
  ) => {
    const score = calculateSubtestScore(
      scores[subtestKey].acertos,
      scores[subtestKey].erros,
      scores[subtestKey].omissoes
    );
    const percentile = lookupPercentile(patientAge, code, score);
    const classification = getClassification(percentile);

    return (
      <div key={code} className="space-y-1.5 p-2.5 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between gap-2">
          <Label className="font-medium text-xs sm:text-sm">{name} ({code})</Label>
          <Badge variant={getClassificationVariant(classification)} className="text-[10px] sm:text-xs shrink-0">
            {classification}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div>
            <Label className="text-[10px] sm:text-xs text-muted-foreground">A</Label>
            <Input
              type="number"
              min="0"
              value={scores[subtestKey].acertos || ''}
              onChange={(e) => updateScore(subtestKey, 'acertos', e.target.value)}
              className="h-8 text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-[10px] sm:text-xs text-muted-foreground">E</Label>
            <Input
              type="number"
              min="0"
              value={scores[subtestKey].erros || ''}
              onChange={(e) => updateScore(subtestKey, 'erros', e.target.value)}
              className="h-8 text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-[10px] sm:text-xs text-muted-foreground">O</Label>
            <Input
              type="number"
              min="0"
              value={scores[subtestKey].omissoes || ''}
              onChange={(e) => updateScore(subtestKey, 'omissoes', e.target.value)}
              className="h-8 text-sm"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
          <span className="text-muted-foreground">
            = <strong className="text-foreground">{score}</strong>
          </span>
          <span className="text-muted-foreground">
            P<strong className="text-foreground">{percentile}</strong>
          </span>
        </div>
      </div>
    );
  };

  const agScore = calculateAG(
    calculateSubtestScore(scores.ac.acertos, scores.ac.erros, scores.ac.omissoes),
    calculateSubtestScore(scores.ad.acertos, scores.ad.erros, scores.ad.omissoes),
    calculateSubtestScore(scores.aa.acertos, scores.aa.erros, scores.aa.omissoes)
  );
  const agPercentile = lookupPercentile(patientAge, 'AG', agScore);
  const agClassification = getClassification(agPercentile);

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {BPA2_TEST.name}
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
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2.5">
        {/* Subtestes */}
        {renderSubtestRow('AC', 'Atenção Concentrada', 'ac')}
        {renderSubtestRow('AD', 'Atenção Dividida', 'ad')}
        {renderSubtestRow('AA', 'Atenção Alternada', 'aa')}

        {/* Atenção Geral (calculado) */}
        <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <Label className="font-medium text-xs sm:text-sm">AG</Label>
              <span className="text-sm font-bold text-foreground">{agScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">P{agPercentile}</span>
              <Badge variant={getClassificationVariant(agClassification)} className="text-[10px] sm:text-xs">
                {agClassification}
              </Badge>
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

function getClassificationVariant(classification: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (classification.includes('Inferior')) return 'destructive';
  if (classification.includes('Superior')) return 'default';
  return 'secondary';
}
