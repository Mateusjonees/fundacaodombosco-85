import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  STROOP_TEST, calculateStroopResults, isAgeValidForStroop, getStroopAgeGroup,
  type StroopScores, type StroopResults 
} from '@/data/neuroTests/stroop';
import { AlertCircle, Info } from 'lucide-react';

interface NeuroTestStroopFormProps {
  patientAge: number;
  onResultsChange: (results: StroopResults | null) => void;
}

const NeuroTestStroopForm: React.FC<NeuroTestStroopFormProps> = ({ patientAge, onResultsChange }) => {
  const [scores, setScores] = useState<StroopScores>({
    cartao1Tempo: 0, cartao1Erros: 0,
    cartao2Tempo: 0, cartao2Erros: 0,
    cartao3Tempo: 0, cartao3Erros: 0
  });
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
      case 'Média': return 'bg-blue-500 text-white';
      case 'Média Inferior': return 'bg-yellow-500 text-white';
      case 'Inferior': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!isValidAge) {
    return (
      <Card className="border-destructive">
        <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" />{STROOP_TEST.name} - Idade Inválida</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Este teste é aplicável para pacientes de {STROOP_TEST.minAge} a {STROOP_TEST.maxAge} anos. Idade atual: {patientAge} anos.</p></CardContent>
      </Card>
    );
  }

  const ageGroup = getStroopAgeGroup(patientAge);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {STROOP_TEST.name}
          <Badge variant="outline" className="ml-2">{STROOP_TEST.minAge}-{STROOP_TEST.maxAge} anos</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{STROOP_TEST.fullName}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">Faixa etária:</span>{' '}
            <span className="text-muted-foreground">{ageGroup || '-'}</span>
          </div>
        </div>

        {/* Cartão 1 */}
        <div>
          <h4 className="font-medium text-sm mb-3">Cartão 1 - Nomeação de Cores</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stroop-c1-tempo">Tempo (segundos)</Label>
              <Input id="stroop-c1-tempo" type="number" step="0.1" min="0"
                value={scores.cartao1Tempo || ''} onChange={e => handleChange('cartao1Tempo', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stroop-c1-erros">Erros</Label>
              <Input id="stroop-c1-erros" type="number" min="0"
                value={scores.cartao1Erros || ''} onChange={e => handleChange('cartao1Erros', e.target.value)} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Cartão 2 */}
        <div>
          <h4 className="font-medium text-sm mb-3">Cartão 2 - Leitura de Palavras Coloridas</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stroop-c2-tempo">Tempo (segundos)</Label>
              <Input id="stroop-c2-tempo" type="number" step="0.1" min="0"
                value={scores.cartao2Tempo || ''} onChange={e => handleChange('cartao2Tempo', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stroop-c2-erros">Erros</Label>
              <Input id="stroop-c2-erros" type="number" min="0"
                value={scores.cartao2Erros || ''} onChange={e => handleChange('cartao2Erros', e.target.value)} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Cartão 3 */}
        <div>
          <h4 className="font-medium text-sm mb-3">Cartão 3 - Interferência (Cor da tinta)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stroop-c3-tempo">Tempo (segundos)</Label>
              <Input id="stroop-c3-tempo" type="number" step="0.1" min="0"
                value={scores.cartao3Tempo || ''} onChange={e => handleChange('cartao3Tempo', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stroop-c3-erros">Erros</Label>
              <Input id="stroop-c3-erros" type="number" min="0"
                value={scores.cartao3Erros || ''} onChange={e => handleChange('cartao3Erros', e.target.value)} />
            </div>
          </div>
        </div>

        {results && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Resultados</h4>
            
            {/* Cálculos */}
            <div className="bg-muted/30 p-3 rounded-lg space-y-1">
              <p className="text-sm"><strong>Efeito Interferência:</strong> {results.calculatedScores.interferencia}s (C3 - C1)</p>
              <p className="text-sm"><strong>Razão Interferência:</strong> {results.calculatedScores.razaoInterferencia} (C3 / C1)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Variável</th>
                  <th className="text-center py-2 px-3 font-medium">Tempo (s)</th>
                  <th className="text-center py-2 px-3 font-medium">Erros</th>
                  <th className="text-center py-2 px-3 font-medium">Percentil</th>
                  <th className="text-center py-2 px-3 font-medium">Classificação</th>
                </tr></thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">Cartão 1</td>
                    <td className="text-center py-2 px-3">{scores.cartao1Tempo}</td>
                    <td className="text-center py-2 px-3">{scores.cartao1Erros}</td>
                    <td className="text-center py-2 px-3">P{results.percentiles.cartao1Tempo}</td>
                    <td className="text-center py-2 px-3"><Badge className={getBadgeColor(results.classifications.cartao1Tempo)}>{results.classifications.cartao1Tempo}</Badge></td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">Cartão 2</td>
                    <td className="text-center py-2 px-3">{scores.cartao2Tempo}</td>
                    <td className="text-center py-2 px-3">{scores.cartao2Erros}</td>
                    <td className="text-center py-2 px-3">P{results.percentiles.cartao2Tempo}</td>
                    <td className="text-center py-2 px-3"><Badge className={getBadgeColor(results.classifications.cartao2Tempo)}>{results.classifications.cartao2Tempo}</Badge></td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">Cartão 3</td>
                    <td className="text-center py-2 px-3">{scores.cartao3Tempo}</td>
                    <td className="text-center py-2 px-3">{scores.cartao3Erros}</td>
                    <td className="text-center py-2 px-3">P{results.percentiles.cartao3Tempo}</td>
                    <td className="text-center py-2 px-3"><Badge className={getBadgeColor(results.classifications.cartao3Tempo)}>{results.classifications.cartao3Tempo}</Badge></td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">Interferência</td>
                    <td className="text-center py-2 px-3">{results.calculatedScores.interferencia}s</td>
                    <td className="text-center py-2 px-3">-</td>
                    <td className="text-center py-2 px-3">P{results.percentiles.interferencia}</td>
                    <td className="text-center py-2 px-3"><Badge className={getBadgeColor(results.classifications.interferencia)}>{results.classifications.interferencia}</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">Nota:</p>
              <p>Tempos menores indicam melhor desempenho. Percentis invertidos (menor tempo = maior percentil).</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeuroTestStroopForm;
