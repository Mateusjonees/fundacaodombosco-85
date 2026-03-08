import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type CancelamentoResults } from '@/data/neuroTests/cancelamento';

interface Props {
  patientAge: number;
  onResultsChange: (results: CancelamentoResults | null) => void;
}

const classOptions = ['Superior', 'Média', 'Média Inferior', 'Limítrofe', 'Deficitário'];

export default function NeuroTestCancelamentoForm({ patientAge, onResultsChange }: Props) {
  const [acertos, setAcertos] = useState<string>('');
  const [erros, setErros] = useState<string>('');
  const [omissoes, setOmissoes] = useState<string>('');
  const [classificacao, setClassificacao] = useState<string>('');

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
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Teste de Atenção por Cancelamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Acertos</Label>
            <Input type="number" min="0" value={acertos} onChange={(e) => setAcertos(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Erros (Comissão)</Label>
            <Input type="number" min="0" value={erros} onChange={(e) => setErros(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Omissões</Label>
            <Input type="number" min="0" value={omissoes} onChange={(e) => setOmissoes(e.target.value)} className="h-9" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Total Líquido</Label>
            <Badge variant="outline">{a - (e + o)}</Badge>
          </div>
          <div>
            <Label className="text-xs">Classificação (conforme manual)</Label>
            <Select value={classificacao} onValueChange={setClassificacao}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {classificacao && (
          <Badge className={getColor(classificacao)}>{classificacao}</Badge>
        )}
      </CardContent>
    </Card>
  );
}
