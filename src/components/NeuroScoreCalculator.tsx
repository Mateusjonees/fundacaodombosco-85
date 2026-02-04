import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, BarChart3, TrendingUp, ClipboardCopy, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Calculadora de Percentis e Z-Scores para testes neuropsicológicos
 * 
 * PERCENTIL (FVA, TFV, TMT, FPT Adulto, Hayling Infantil):
 * - Exato: 5, 25, 50, 75, 95
 * - Faixas: <5, 5-25, 25-50, 50-75, 75-95, >95
 * - Classificação: <5 ou 5 = Inferior; 5-25 ou 25 = Média Inferior; 25-50, 50 ou 50-75 = Média;
 *   75 ou 75-95 = Média Superior; 95 ou >95 = Superior
 * 
 * Z-SCORE (BNT-BR, Span de Dígitos, Cubos de Corsi, Hayling Adulto, Taylor, TOM, FAS):
 * - Z = (Pontuação - Média) / Desvio Padrão
 * - Classificação: >=1.37 = Superior; 0.66 a 1.36 = Médio Superior; -0.69 a 0.65 = Médio;
 *   -1.31 a -0.70 = Médio Inferior; <=-1.32 = Inferior
 */

// Testes baseados em percentil
const PERCENTILE_TESTS = [
  { id: 'FVA', name: 'FVA (Fluência Verbal Animais)' },
  { id: 'TFV', name: 'TFV (Teste de Fluência Verbal)' },
  { id: 'TMT', name: 'TMT (Trail Making Test)' },
  { id: 'FPT_ADULTO', name: 'FPT Adulto (Five-Point Test)' },
  { id: 'HAYLING_INFANTIL', name: 'Hayling Infantil' },
];

// Testes baseados em Z-Score
const ZSCORE_TESTS = [
  { id: 'BNTBR', name: 'BNT-BR (Boston Naming Test)' },
  { id: 'SPAN_DIGITOS', name: 'Span de Dígitos' },
  { id: 'CUBOS_CORSI', name: 'Cubos de Corsi' },
  { id: 'HAYLING_ADULTO', name: 'Hayling Adulto' },
  { id: 'TAYLOR', name: 'Taylor (Figura Complexa)' },
  { id: 'TOM', name: 'TOM (Teoria da Mente)' },
  { id: 'FAS', name: 'FAS (Fluência Fonêmica)' },
];

// Classificação por percentil
const getPercentileClassification = (percentile: number | string): string => {
  const p = typeof percentile === 'string' ? percentile : String(percentile);
  const numericPercentile = typeof percentile === 'number' ? percentile : parseFloat(percentile);
  
  if (p === '<5' || p === '5' || (!isNaN(numericPercentile) && numericPercentile <= 5)) return 'Inferior';
  if (p === '5-25' || p === '25' || (!isNaN(numericPercentile) && numericPercentile > 5 && numericPercentile <= 25)) return 'Média Inferior';
  if (p === '25-50' || p === '50' || p === '50-75' || (!isNaN(numericPercentile) && numericPercentile > 25 && numericPercentile <= 75)) return 'Média';
  if (p === '75' || p === '75-95' || (!isNaN(numericPercentile) && numericPercentile > 75 && numericPercentile < 95)) return 'Média Superior';
  if (p === '95' || p === '>95' || (!isNaN(numericPercentile) && numericPercentile >= 95)) return 'Superior';
  
  return 'Média';
};

// Classificação por Z-Score
const getZScoreClassification = (zScore: number): string => {
  if (zScore >= 1.37) return 'Superior';
  if (zScore >= 0.66 && zScore <= 1.36) return 'Médio Superior';
  if (zScore >= -0.69 && zScore <= 0.65) return 'Médio';
  if (zScore >= -1.31 && zScore <= -0.70) return 'Médio Inferior';
  if (zScore <= -1.32) return 'Inferior';
  return 'Médio';
};

// Badge variant por classificação
const getClassificationVariant = (classification: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (classification.includes('Inferior') && !classification.includes('Média')) return 'destructive';
  if (classification === 'Média Inferior') return 'outline';
  if (classification.includes('Superior') && !classification.includes('Média')) return 'default';
  return 'secondary';
};

export default function NeuroScoreCalculator() {
  const { toast } = useToast();
  
  // Estado para Percentil
  const [selectedPercentileTest, setSelectedPercentileTest] = useState('');
  const [percentileType, setPercentileType] = useState<'exact' | 'range'>('exact');
  const [exactPercentile, setExactPercentile] = useState('');
  const [rangePercentile, setRangePercentile] = useState('');
  const [percentileResult, setPercentileResult] = useState<{ percentile: string; classification: string } | null>(null);
  
  // Estado para Z-Score
  const [selectedZScoreTest, setSelectedZScoreTest] = useState('');
  const [rawScore, setRawScore] = useState('');
  const [mean, setMean] = useState('');
  const [standardDeviation, setStandardDeviation] = useState('');
  const [zScoreResult, setZScoreResult] = useState<{ zScore: number; classification: string } | null>(null);

  // Calcular percentil
  const calculatePercentile = () => {
    if (!selectedPercentileTest) {
      toast({ title: 'Selecione um teste', variant: 'destructive' });
      return;
    }
    
    let percentile: string;
    if (percentileType === 'exact') {
      if (!exactPercentile) {
        toast({ title: 'Informe o percentil', variant: 'destructive' });
        return;
      }
      percentile = exactPercentile;
    } else {
      if (!rangePercentile) {
        toast({ title: 'Selecione a faixa percentílica', variant: 'destructive' });
        return;
      }
      percentile = rangePercentile;
    }
    
    const classification = getPercentileClassification(
      percentileType === 'exact' ? parseFloat(percentile) : percentile
    );
    
    setPercentileResult({ percentile, classification });
  };

  // Calcular Z-Score
  const calculateZScore = () => {
    if (!selectedZScoreTest) {
      toast({ title: 'Selecione um teste', variant: 'destructive' });
      return;
    }
    
    const score = parseFloat(rawScore);
    const m = parseFloat(mean);
    const sd = parseFloat(standardDeviation);
    
    if (isNaN(score) || isNaN(m) || isNaN(sd) || sd === 0) {
      toast({ title: 'Preencha todos os campos corretamente', variant: 'destructive' });
      return;
    }
    
    const zScore = (score - m) / sd;
    const classification = getZScoreClassification(zScore);
    
    setZScoreResult({ zScore: Math.round(zScore * 100) / 100, classification });
  };

  // Copiar resultado
  const copyResult = (type: 'percentile' | 'zscore') => {
    let text = '';
    if (type === 'percentile' && percentileResult) {
      const testName = PERCENTILE_TESTS.find(t => t.id === selectedPercentileTest)?.name || selectedPercentileTest;
      text = `${testName}: Percentil ${percentileResult.percentile}, Classificação ${percentileResult.classification}`;
    } else if (type === 'zscore' && zScoreResult) {
      const testName = ZSCORE_TESTS.find(t => t.id === selectedZScoreTest)?.name || selectedZScoreTest;
      text = `${testName}: Z-Score ${zScoreResult.zScore.toFixed(2)}, Classificação ${zScoreResult.classification}`;
    }
    
    if (text) {
      navigator.clipboard.writeText(text);
      toast({ title: 'Copiado!', description: 'Resultado copiado para a área de transferência.' });
    }
  };

  // Limpar formulários
  const resetPercentile = () => {
    setSelectedPercentileTest('');
    setPercentileType('exact');
    setExactPercentile('');
    setRangePercentile('');
    setPercentileResult(null);
  };

  const resetZScore = () => {
    setSelectedZScoreTest('');
    setRawScore('');
    setMean('');
    setStandardDeviation('');
    setZScoreResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Calculadora de Scores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="percentile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="percentile" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Percentil
            </TabsTrigger>
            <TabsTrigger value="zscore" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Z-Score
            </TabsTrigger>
          </TabsList>

          {/* Aba Percentil */}
          <TabsContent value="percentile" className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p className="font-medium mb-1">Testes: FVA, TFV, TMT, FPT Adulto, Hayling Infantil</p>
              <p>• Percentis exatos: 5, 25, 50, 75, 95</p>
              <p>• Faixas: &lt;5, 5-25, 25-50, 50-75, 75-95, &gt;95</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Teste</Label>
                <Select value={selectedPercentileTest} onValueChange={setSelectedPercentileTest}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o teste" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERCENTILE_TESTS.map(test => (
                      <SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Percentil</Label>
                <Select value={percentileType} onValueChange={(v) => setPercentileType(v as 'exact' | 'range')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Percentil Exato</SelectItem>
                    <SelectItem value="range">Faixa Percentílica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {percentileType === 'exact' ? (
                <div className="space-y-2">
                  <Label>Percentil</Label>
                  <Select value={exactPercentile} onValueChange={setExactPercentile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o percentil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="75">75</SelectItem>
                      <SelectItem value="95">95</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Faixa Percentílica</Label>
                  <Select value={rangePercentile} onValueChange={setRangePercentile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a faixa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<5">&lt;5</SelectItem>
                      <SelectItem value="5-25">5-25</SelectItem>
                      <SelectItem value="25-50">25-50</SelectItem>
                      <SelectItem value="50-75">50-75</SelectItem>
                      <SelectItem value="75-95">75-95</SelectItem>
                      <SelectItem value=">95">&gt;95</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={calculatePercentile} className="flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </Button>
                <Button variant="outline" size="icon" onClick={resetPercentile}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {percentileResult && (
                <div className="p-4 bg-primary/5 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resultado:</span>
                    <Button variant="ghost" size="sm" onClick={() => copyResult('percentile')}>
                      <ClipboardCopy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Percentil</p>
                      <p className="text-2xl font-bold">{percentileResult.percentile}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Classificação</p>
                      <Badge variant={getClassificationVariant(percentileResult.classification)} className="text-sm">
                        {percentileResult.classification}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-xs">
              <p className="font-medium mb-1">Classificações:</p>
              <ul className="space-y-0.5 text-muted-foreground">
                <li>• &lt;5 ou 5 → <span className="text-destructive font-medium">Inferior</span></li>
                <li>• 5-25 ou 25 → <span className="text-muted-foreground font-medium">Média Inferior</span></li>
                <li>• 25-50, 50 ou 50-75 → <span className="text-secondary-foreground font-medium">Média</span></li>
                <li>• 75 ou 75-95 → <span className="text-secondary-foreground font-medium">Média Superior</span></li>
                <li>• 95 ou &gt;95 → <span className="text-primary font-medium">Superior</span></li>
              </ul>
            </div>
          </TabsContent>

          {/* Aba Z-Score */}
          <TabsContent value="zscore" className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p className="font-medium mb-1">Testes: BNT-BR, Span de Dígitos, Cubos de Corsi, Hayling Adulto, Taylor, TOM, FAS</p>
              <p>• Fórmula: Z = (Pontuação - Média) / Desvio Padrão</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Teste</Label>
                <Select value={selectedZScoreTest} onValueChange={setSelectedZScoreTest}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o teste" />
                  </SelectTrigger>
                  <SelectContent>
                    {ZSCORE_TESTS.map(test => (
                      <SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Pontuação</Label>
                  <Input 
                    type="number"
                    placeholder="Score"
                    value={rawScore}
                    onChange={(e) => setRawScore(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Média (M)</Label>
                  <Input 
                    type="number"
                    placeholder="Média"
                    value={mean}
                    onChange={(e) => setMean(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>DP</Label>
                  <Input 
                    type="number"
                    placeholder="D. Padrão"
                    value={standardDeviation}
                    onChange={(e) => setStandardDeviation(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={calculateZScore} className="flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </Button>
                <Button variant="outline" size="icon" onClick={resetZScore}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {zScoreResult && (
                <div className="p-4 bg-primary/5 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resultado:</span>
                    <Button variant="ghost" size="sm" onClick={() => copyResult('zscore')}>
                      <ClipboardCopy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Z-Score</p>
                      <p className="text-2xl font-bold">{zScoreResult.zScore.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Classificação</p>
                      <Badge variant={getClassificationVariant(zScoreResult.classification)} className="text-sm">
                        {zScoreResult.classification}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    Fórmula: ({rawScore} - {mean}) / {standardDeviation} = {zScoreResult.zScore.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-xs">
              <p className="font-medium mb-1">Classificações por Z-Score:</p>
              <ul className="space-y-0.5 text-muted-foreground">
                <li>• ≥ 1.37 → <span className="text-primary font-medium">Superior</span></li>
                <li>• 0.66 a 1.36 → <span className="text-secondary-foreground font-medium">Médio Superior</span></li>
                <li>• -0.69 a 0.65 → <span className="text-secondary-foreground font-medium">Médio</span></li>
                <li>• -1.31 a -0.70 → <span className="text-muted-foreground font-medium">Médio Inferior</span></li>
                <li>• ≤ -1.32 → <span className="text-destructive font-medium">Inferior</span></li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
