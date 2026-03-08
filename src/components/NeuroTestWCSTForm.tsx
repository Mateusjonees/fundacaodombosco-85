import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { 
  WCST_TEST, calculateWCSTResults, isAgeValidForWCST, getWCSTAgeGroup,
  type WCSTScores, type WCSTResults 
} from '@/data/neuroTests/wcst';
import { AlertCircle, Info, ChevronDown, Brain, Trash2, Calculator } from 'lucide-react';

interface NeuroTestWCSTFormProps {
  patientAge: number;
  onResultsChange: (results: WCSTResults | null) => void;
  onRemove?: () => void;
}

const NeuroTestWCSTForm: React.FC<NeuroTestWCSTFormProps> = ({ patientAge, onResultsChange, onRemove }) => {
  const [scores, setScores] = useState<WCSTScores>({
    totalErrors: 0, perseverativeResponses: 0, perseverativeErrors: 0,
    nonPerseverativeErrors: 0, categoriesCompleted: 0, trialsToFirst: 0,
    failureToMaintain: 0, totalTrials: 128
  });
  const [notes, setNotes] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
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
      case 'Média': return 'bg-primary text-primary-foreground';
      case 'Média Inferior': return 'bg-yellow-500 text-white';
      case 'Abaixo da Média': return 'bg-orange-500 text-white';
      case 'Inferior': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted';
    }
  };

  if (!isValidAge) {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            {WCST_TEST.name} - Idade Inválida
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground">
            Aplicável para {WCST_TEST.minAge}-{WCST_TEST.maxAge} anos. Idade atual: {patientAge} anos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {WCST_TEST.name} - {WCST_TEST.fullName}
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Avalia funções executivas e flexibilidade cognitiva • Faixa: {getWCSTAgeGroup(patientAge) || '-'} • {patientAge} anos
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
              <p>• O paciente combina 128 cartas com 4 cartas-estímulo, seguindo regras que mudam sem aviso.</p>
              <p>• O examinador diz apenas "correto" ou "errado" a cada tentativa.</p>
              <p>• Critérios de classificação: cor, forma, número. Categoria completa = 10 acertos consecutivos.</p>
              <p>• Sem limite de tempo. Aplicação individual.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Seção: Tentativas e Categorias */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tentativas e Categorias</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs sm:text-sm">Total de Tentativas</Label>
              <Input type="number" min="0" max="128" value={scores.totalTrials || ''} onChange={e => handleChange('totalTrials', e.target.value)} className="h-9 mt-1" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Máximo: 128 cartas</p>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Categorias Completadas</Label>
              <Input type="number" min="0" max="6" value={scores.categoriesCompleted || ''} onChange={e => handleChange('categoriesCompleted', e.target.value)} className="h-9 mt-1" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Máximo: 6</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Seção: Erros */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Erros</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs sm:text-sm">Total de Erros</Label>
              <Input type="number" min="0" value={scores.totalErrors || ''} onChange={e => handleChange('totalErrors', e.target.value)} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Erros Não-Perseverativos</Label>
              <Input type="number" min="0" value={scores.nonPerseverativeErrors || ''} onChange={e => handleChange('nonPerseverativeErrors', e.target.value)} className="h-9 mt-1" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Seção: Perseveração */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Perseveração</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs sm:text-sm">Respostas Perseverativas</Label>
              <Input type="number" min="0" value={scores.perseverativeResponses || ''} onChange={e => handleChange('perseverativeResponses', e.target.value)} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Erros Perseverativos</Label>
              <Input type="number" min="0" value={scores.perseverativeErrors || ''} onChange={e => handleChange('perseverativeErrors', e.target.value)} className="h-9 mt-1" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Seção: Outros Indicadores */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outros Indicadores</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs sm:text-sm">Tentativas p/ 1ª Categoria</Label>
              <Input type="number" min="0" value={scores.trialsToFirst || ''} onChange={e => handleChange('trialsToFirst', e.target.value)} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Falha em Manter o Set</Label>
              <Input type="number" min="0" value={scores.failureToMaintain || ''} onChange={e => handleChange('failureToMaintain', e.target.value)} className="h-9 mt-1" />
            </div>
          </div>
        </div>

        {/* Resultados */}
        {results && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-primary" />
                <Label className="text-xs font-medium text-primary uppercase tracking-wide">Resultados</Label>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">% Acertos</span>
                  <p className="font-bold">{results.calculatedScores.percentCorrect}%</p>
                </div>
                <div className="p-2 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">% Erros Persev.</span>
                  <p className="font-bold">{results.calculatedScores.percentPerseverativeErrors}%</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="border-b">
                    <th className="text-left py-1.5 px-2 font-medium">Variável</th>
                    <th className="text-center py-1.5 px-2 font-medium">Bruto</th>
                    <th className="text-center py-1.5 px-2 font-medium">Percentil</th>
                    <th className="text-center py-1.5 px-2 font-medium">Classificação</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { label: 'Total de Erros', key: 'totalErrors' as const, raw: scores.totalErrors },
                      { label: 'Resp. Perseverativas', key: 'perseverativeResponses' as const, raw: scores.perseverativeResponses },
                      { label: 'Erros Perseverativos', key: 'perseverativeErrors' as const, raw: scores.perseverativeErrors },
                      { label: 'Erros Não-Persev.', key: 'nonPerseverativeErrors' as const, raw: scores.nonPerseverativeErrors },
                      { label: 'Categorias', key: 'categoriesCompleted' as const, raw: scores.categoriesCompleted },
                    ].map(row => (
                      <tr key={row.key} className="border-b hover:bg-muted/50">
                        <td className="py-1.5 px-2 font-medium">{row.label}</td>
                        <td className="text-center py-1.5 px-2">{row.raw}</td>
                        <td className="text-center py-1.5 px-2">P{results.percentiles[row.key]}</td>
                        <td className="text-center py-1.5 px-2">
                          <Badge className={`${getBadgeColor(results.classifications[row.key])} text-[9px]`}>
                            {results.classifications[row.key]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-2 bg-muted/30 rounded-lg text-[10px] text-muted-foreground">
                <p className="font-medium mb-0.5">Nota:</p>
                <p>Para erros e perseveração: percentil invertido. Para categorias: percentil direto.</p>
              </div>
            </div>
          </>
        )}

        {/* Observações */}
        <div className="space-y-1">
          <Label className="text-xs">Obs. do Teste</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comportamento durante a aplicação, estratégias utilizadas..."
            className="min-h-[50px] resize-none text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuroTestWCSTForm;
