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
      <div key={code} className="space-y-2 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="font-medium text-sm">{name} ({code})</Label>
          <Badge variant={getClassificationVariant(classification)} className="text-xs">
            {classification}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Acertos (A)</Label>
            <Input
              type="number"
              min="0"
              value={scores[subtestKey].acertos || ''}
              onChange={(e) => updateScore(subtestKey, 'acertos', e.target.value)}
              className="h-9"
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Erros (E)</Label>
            <Input
              type="number"
              min="0"
              value={scores[subtestKey].erros || ''}
              onChange={(e) => updateScore(subtestKey, 'erros', e.target.value)}
              className="h-9"
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Omissões (O)</Label>
            <Input
              type="number"
              min="0"
              value={scores[subtestKey].omissoes || ''}
              onChange={(e) => updateScore(subtestKey, 'omissoes', e.target.value)}
              className="h-9"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-1 border-t border-border/50">
          <span className="text-muted-foreground">
            Resultado: A - (E + O) = <strong className="text-foreground">{score}</strong>
          </span>
          <span className="text-muted-foreground">
            Percentil: <strong className="text-foreground">{percentile}</strong>
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {BPA2_TEST.name}
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
        <p className="text-xs text-muted-foreground">{BPA2_TEST.fullName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subtestes */}
        {renderSubtestRow('AC', 'Atenção Concentrada', 'ac')}
        {renderSubtestRow('AD', 'Atenção Dividida', 'ad')}
        {renderSubtestRow('AA', 'Atenção Alternada', 'aa')}

        {/* Atenção Geral (calculado) */}
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <Label className="font-medium text-sm">Atenção Geral (AG)</Label>
            </div>
            <Badge variant={getClassificationVariant(agClassification)}>
              {agClassification}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              AC + AD + AA = <strong className="text-foreground text-lg">{agScore}</strong>
            </span>
            <span className="text-muted-foreground">
              Percentil: <strong className="text-foreground text-lg">{agPercentile}</strong>
            </span>
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label className="text-sm">Observações do Teste</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre a aplicação do teste, comportamento do paciente, etc."
            className="min-h-[80px] resize-none"
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
