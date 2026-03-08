import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type CancelamentoResults } from '@/data/neuroTests/cancelamento';

interface Props {
  patientAge: number;
  onResultsChange: (results: CancelamentoResults | null) => void;
  onRemove?: () => void;
}

const classOptions = ['Superior', 'Média', 'Média Inferior', 'Limítrofe', 'Deficitário'];

export default function NeuroTestCancelamentoForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [acertos, setAcertos] = useState<string>('');
  const [erros, setErros] = useState<string>('');
  const [omissoes, setOmissoes] = useState<string>('');
  const [classificacao, setClassificacao] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const a = parseInt(acertos);
    const e = parseInt(erros);
    const o = parseInt(omissoes);
    if (!isNaN(a) && !isNaN(e) && !isNaN(o) && classificacao) {
      const totalLiquido = a - (e + o);
      onResultsChange({
        rawScores: { acertos: a, erros: e, omissoes: o },
        calculatedScores: { totalLiquido },
        classifications: { totalLiquido: classificacao },
        notes: `Acertos: ${a} | Erros: ${e} | Omissões: ${o} | Total Líquido: ${totalLiquido} | ${classificacao}`
      });
    } else {
      onResultsChange(null);
    }
  }, [acertos, erros, omissoes, classificacao]);

  const a = parseInt(acertos) || 0;
  const e = parseInt(erros) || 0;
  const o = parseInt(omissoes) || 0;

  const getColor = (c: string) => {
    if (c === 'Superior') return 'bg-green-600 text-white';
    if (c === 'Média') return 'bg-blue-600 text-white';
    if (c === 'Média Inferior') return 'bg-yellow-500 text-white';
    if (c === 'Limítrofe') return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Teste de Atenção por Cancelamento
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avalia atenção concentrada e seletiva • 5-14 anos</p>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
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
              <p>• 3 matrizes: 1 estímulo (letras), 2 estímulos (figuras geométricas) e 3 estímulos (figuras com variações).</p>
              <p>• Paciente marca os itens-alvo dentro do tempo (1 minuto por matriz).</p>
              <p>• Total Líquido = Acertos - (Erros + Omissões).</p>
              <p>• A classificação deve ser consultada no manual conforme a idade.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuação</Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Acertos</Label>
              <Input type="number" min="0" value={acertos} onChange={(e) => setAcertos(e.target.value)} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Erros (Comissão)</Label>
              <Input type="number" min="0" value={erros} onChange={(e) => setErros(e.target.value)} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Omissões</Label>
              <Input type="number" min="0" value={omissoes} onChange={(e) => setOmissoes(e.target.value)} className="h-9 mt-1" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Total Líquido</Label>
              <Badge variant="outline" className="mt-1">{a - (e + o)}</Badge>
            </div>
            <div>
              <Label className="text-xs">Classificação (conforme manual)</Label>
              <Select value={classificacao} onValueChange={setClassificacao}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {classificacao && <Badge className={getColor(classificacao)}>{classificacao}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
