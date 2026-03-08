import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  WCST_TEST, calculateWCSTResults, isAgeValidForWCST, getWCSTAgeGroup,
  type WCSTScores, type WCSTResults 
} from '@/data/neuroTests/wcst';
import { AlertCircle, Info } from 'lucide-react';

interface NeuroTestWCSTFormProps {
  patientAge: number;
  onResultsChange: (results: WCSTResults | null) => void;
}

const NeuroTestWCSTForm: React.FC<NeuroTestWCSTFormProps> = ({ patientAge, onResultsChange }) => {
  const [scores, setScores] = useState<WCSTScores>({
    totalErrors: 0, perseverativeResponses: 0, perseverativeErrors: 0,
    nonPerseverativeErrors: 0, categoriesCompleted: 0, trialsToFirst: 0,
    failureToMaintain: 0, totalTrials: 128
  });
  const [results, setResults] = useState<WCSTResults | null>(null);
  const isValidAge = isAgeValidForWCST(patientAge);

  useEffect(() => {
    if (isValidAge && scores.totalTrials > 0) {
      const calc = calculateWCSTResults(scores, patientAge);
      setResults(calc);
      onResultsChange(calc);
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [scores, patientAge, isValidAge, onResultsChange]);

  const handleChange = (field: keyof WCSTScores, value: string) => {
    const num = Math.max(parseInt(value) || 0, 0);
    setScores(prev => ({ ...prev, [field]: num }));
  };

  const getBadgeColor = (cls: string) => {
    switch (cls) {
      case 'Superior': return 'bg-green-600 text-white';
      case 'Média Superior': return 'bg-green-500 text-white';
      case 'Média': return 'bg-blue-500 text-white';
      case 'Média Inferior': return 'bg-yellow-500 text-white';
      case 'Abaixo da Média': return 'bg-orange-500 text-white';
      case 'Inferior': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!isValidAge) {
    return (
      <Card className="border-destructive">
        <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" />{WCST_TEST.name} - Idade Inválida</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Este teste é aplicável para pacientes de {WCST_TEST.minAge} a {WCST_TEST.maxAge} anos. Idade atual: {patientAge} anos.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {WCST_TEST.name}
          <Badge variant="outline" className="ml-2">{WCST_TEST.minAge}-{WCST_TEST.maxAge} anos</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{WCST_TEST.fullName}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">Faixa etária:</span>{' '}
            <span className="text-muted-foreground">{getWCSTAgeGroup(patientAge) || '-'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wcst-total-trials">Total de Tentativas</Label>
            <Input id="wcst-total-trials" type="number" min="0" max="128"
              value={scores.totalTrials || ''} onChange={e => handleChange('totalTrials', e.target.value)} />
            <p className="text-xs text-muted-foreground">Máximo: 128 cartas</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wcst-categories">Categorias Completadas (0-6)</Label>
            <Input id="wcst-categories" type="number" min="0" max="6"
              value={scores.categoriesCompleted || ''} onChange={e => handleChange('categoriesCompleted', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wcst-total-errors">Total de Erros</Label>
            <Input id="wcst-total-errors" type="number" min="0"
              value={scores.totalErrors || ''} onChange={e => handleChange('totalErrors', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wcst-persev-resp">Respostas Perseverativas</Label>
            <Input id="wcst-persev-resp" type="number" min="0"
              value={scores.perseverativeResponses || ''} onChange={e => handleChange('perseverativeResponses', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wcst-persev-errors">Erros Perseverativos</Label>
            <Input id="wcst-persev-errors" type="number" min="0"
              value={scores.perseverativeErrors || ''} onChange={e => handleChange('perseverativeErrors', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wcst-non-persev">Erros Não-Perseverativos</Label>
            <Input id="wcst-non-persev" type="number" min="0"
              value={scores.nonPerseverativeErrors || ''} onChange={e => handleChange('nonPerseverativeErrors', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wcst-trials-first">Tentativas p/ 1ª Categoria</Label>
            <Input id="wcst-trials-first" type="number" min="0"
              value={scores.trialsToFirst || ''} onChange={e => handleChange('trialsToFirst', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wcst-ftm">Falha em Manter o Set</Label>
            <Input id="wcst-ftm" type="number" min="0"
              value={scores.failureToMaintain || ''} onChange={e => handleChange('failureToMaintain', e.target.value)} />
          </div>
        </div>

        {results && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Resultados</h4>
            
            <div className="bg-muted/30 p-3 rounded-lg space-y-1">
              <p className="text-sm"><strong>% Acertos:</strong> {results.calculatedScores.percentCorrect}%</p>
              <p className="text-sm"><strong>% Erros Perseverativos:</strong> {results.calculatedScores.percentPerseverativeErrors}%</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Variável</th>
                  <th className="text-center py-2 px-3 font-medium">Bruto</th>
                  <th className="text-center py-2 px-3 font-medium">Percentil</th>
                  <th className="text-center py-2 px-3 font-medium">Classificação</th>
                </tr></thead>
                <tbody>
                  {[
                    { label: 'Total de Erros', key: 'totalErrors' as const, raw: scores.totalErrors },
                    { label: 'Respostas Perseverativas', key: 'perseverativeResponses' as const, raw: scores.perseverativeResponses },
                    { label: 'Erros Perseverativos', key: 'perseverativeErrors' as const, raw: scores.perseverativeErrors },
                    { label: 'Erros Não-Perseverativos', key: 'nonPerseverativeErrors' as const, raw: scores.nonPerseverativeErrors },
                    { label: 'Categorias Completadas', key: 'categoriesCompleted' as const, raw: scores.categoriesCompleted },
                  ].map(row => (
                    <tr key={row.key} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{row.label}</td>
                      <td className="text-center py-2 px-3">{row.raw}</td>
                      <td className="text-center py-2 px-3">P{results.percentiles[row.key]}</td>
                      <td className="text-center py-2 px-3">
                        <Badge className={getBadgeColor(results.classifications[row.key])}>
                          {results.classifications[row.key]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">Nota:</p>
              <p>Para erros e perseveração, percentil invertido (menos erros = maior percentil). Para categorias, percentil direto.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeuroTestWCSTForm;
