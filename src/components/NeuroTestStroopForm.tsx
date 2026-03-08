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
  STROOP_TEST, calculateStroopResults, isAgeValidForStroop, getStroopAgeGroup,
  type StroopScores, type StroopResults 
} from '@/data/neuroTests/stroop';
import { AlertCircle, Info, ChevronDown, Brain, Trash2, Calculator } from 'lucide-react';

interface NeuroTestStroopFormProps {
  patientAge: number;
  onResultsChange: (results: StroopResults | null) => void;
  onRemove?: () => void;
}

const NeuroTestStroopForm: React.FC<NeuroTestStroopFormProps> = ({ patientAge, onResultsChange, onRemove }) => {
  const [scores, setScores] = useState<StroopScores>({
    cartao1Tempo: 0, cartao1Erros: 0,
    cartao2Tempo: 0, cartao2Erros: 0,
    cartao3Tempo: 0, cartao3Erros: 0
  });
  const [notes, setNotes] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [results, setResults] = useState<StroopResults | null>(null);
  const isValidAge = isAgeValidForStroop(patientAge);

  useEffect(() => {
    if (isValidAge && scores.cartao1Tempo > 0 && scores.cartao3Tempo > 0) {
      const calc = calculateStroopResults(scores, patientAge);
      setResults(calc);
      onResultsChange(calc);
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [scores, patientAge, isValidAge, onResultsChange]);

  const handleChange = (field: keyof StroopScores, value: string) => {
    const num = Math.max(parseFloat(value) || 0, 0);
    setScores(prev => ({ ...prev, [field]: num }));
  };

  const getBadgeColor = (cls: string) => {
    switch (cls) {
      case 'Superior': return 'bg-green-600 text-white';
      case 'Média Superior': return 'bg-green-500 text-white';
      case 'Média': return 'bg-primary text-primary-foreground';
      case 'Média Inferior': return 'bg-yellow-500 text-white';
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
            {STROOP_TEST.name} - Idade Inválida
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground">
            Aplicável para {STROOP_TEST.minAge}-{STROOP_TEST.maxAge} anos. Idade atual: {patientAge} anos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const ageGroup = getStroopAgeGroup(patientAge);

  const cartoes = [
    { num: 1, title: 'Cartão 1 - Nomeação de Cores', desc: 'Nomear a cor dos retângulos coloridos', tempoKey: 'cartao1Tempo' as const, erroKey: 'cartao1Erros' as const },
    { num: 2, title: 'Cartão 2 - Leitura de Palavras', desc: 'Ler palavras coloridas (congruente)', tempoKey: 'cartao2Tempo' as const, erroKey: 'cartao2Erros' as const },
    { num: 3, title: 'Cartão 3 - Interferência', desc: 'Nomear a cor da tinta (incongruente)', tempoKey: 'cartao3Tempo' as const, erroKey: 'cartao3Erros' as const },
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {STROOP_TEST.name} - {STROOP_TEST.fullName}
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Avalia controle inibitório e atenção seletiva • Faixa: {ageGroup || '-'} • {patientAge} anos
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
              <p>• <strong>Cartão 1</strong>: Apresentar retângulos coloridos. O paciente nomeia as cores o mais rápido possível.</p>
              <p>• <strong>Cartão 2</strong>: Palavras de cores impressas na cor congruente. O paciente lê as palavras.</p>
              <p>• <strong>Cartão 3</strong>: Palavras de cores impressas em cor incongruente. O paciente nomeia a cor da tinta (não lê a palavra).</p>
              <p>• Registrar tempo (em segundos) e número de erros para cada cartão.</p>
              <p>• Aplicação individual, duração de ~5 minutos.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Cartões */}
        {cartoes.map((cartao, idx) => (
          <React.Fragment key={cartao.num}>
            {idx > 0 && <Separator />}
            <div className="space-y-2">
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{cartao.title}</Label>
                <p className="text-[10px] text-muted-foreground">{cartao.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs sm:text-sm">Tempo (segundos)</Label>
                  <Input type="number" step="0.1" min="0"
                    value={scores[cartao.tempoKey] || ''} onChange={e => handleChange(cartao.tempoKey, e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Erros</Label>
                  <Input type="number" min="0"
                    value={scores[cartao.erroKey] || ''} onChange={e => handleChange(cartao.erroKey, e.target.value)} className="h-9 mt-1" />
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}

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
                  <span className="text-muted-foreground">Efeito Interferência</span>
                  <p className="font-bold">{results.calculatedScores.interferencia}s</p>
                  <p className="text-[9px] text-muted-foreground">C3 - C1</p>
                </div>
                <div className="p-2 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Razão Interferência</span>
                  <p className="font-bold">{results.calculatedScores.razaoInterferencia}</p>
                  <p className="text-[9px] text-muted-foreground">C3 / C1</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="border-b">
                    <th className="text-left py-1.5 px-2 font-medium">Variável</th>
                    <th className="text-center py-1.5 px-2 font-medium">Tempo</th>
                    <th className="text-center py-1.5 px-2 font-medium">Erros</th>
                    <th className="text-center py-1.5 px-2 font-medium">Percentil</th>
                    <th className="text-center py-1.5 px-2 font-medium">Classificação</th>
                  </tr></thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-1.5 px-2 font-medium">Cartão 1</td>
                      <td className="text-center py-1.5 px-2">{scores.cartao1Tempo}s</td>
                      <td className="text-center py-1.5 px-2">{scores.cartao1Erros}</td>
                      <td className="text-center py-1.5 px-2">P{results.percentiles.cartao1Tempo}</td>
                      <td className="text-center py-1.5 px-2"><Badge className={`${getBadgeColor(results.classifications.cartao1Tempo)} text-[9px]`}>{results.classifications.cartao1Tempo}</Badge></td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-1.5 px-2 font-medium">Cartão 2</td>
                      <td className="text-center py-1.5 px-2">{scores.cartao2Tempo}s</td>
                      <td className="text-center py-1.5 px-2">{scores.cartao2Erros}</td>
                      <td className="text-center py-1.5 px-2">P{results.percentiles.cartao2Tempo}</td>
                      <td className="text-center py-1.5 px-2"><Badge className={`${getBadgeColor(results.classifications.cartao2Tempo)} text-[9px]`}>{results.classifications.cartao2Tempo}</Badge></td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-1.5 px-2 font-medium">Cartão 3</td>
                      <td className="text-center py-1.5 px-2">{scores.cartao3Tempo}s</td>
                      <td className="text-center py-1.5 px-2">{scores.cartao3Erros}</td>
                      <td className="text-center py-1.5 px-2">P{results.percentiles.cartao3Tempo}</td>
                      <td className="text-center py-1.5 px-2"><Badge className={`${getBadgeColor(results.classifications.cartao3Tempo)} text-[9px]`}>{results.classifications.cartao3Tempo}</Badge></td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="py-1.5 px-2 font-medium">Interferência</td>
                      <td className="text-center py-1.5 px-2">{results.calculatedScores.interferencia}s</td>
                      <td className="text-center py-1.5 px-2">-</td>
                      <td className="text-center py-1.5 px-2">P{results.percentiles.interferencia}</td>
                      <td className="text-center py-1.5 px-2"><Badge className={`${getBadgeColor(results.classifications.interferencia)} text-[9px]`}>{results.classifications.interferencia}</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-2 bg-muted/30 rounded-lg text-[10px] text-muted-foreground">
                <p className="font-medium mb-0.5">Nota:</p>
                <p>Tempos menores = melhor desempenho. Percentis invertidos (menor tempo = maior percentil).</p>
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
            placeholder="Comportamento durante a aplicação, hesitações observadas..."
            className="min-h-[50px] resize-none text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuroTestStroopForm;
