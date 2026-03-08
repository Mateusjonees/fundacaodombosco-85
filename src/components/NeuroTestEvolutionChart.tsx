import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Json } from '@/integrations/supabase/types';

interface NeuroTestResult {
  id: string;
  test_code: string;
  test_name: string;
  patient_age: number;
  raw_scores: Json;
  calculated_scores: Json;
  percentiles: Json;
  classifications: Json;
  applied_at: string;
}

interface NeuroTestEvolutionChartProps {
  tests: NeuroTestResult[];
}

// Testes que usam Escore Padrão (EP) ao invés de Percentil
const EP_TESTS = ['TIN', 'PCFO', 'TSBC', 'TRILHAS', 'TRILHAS_PRE_ESCOLAR'];

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 50%)',
  'hsl(150, 60%, 45%)',
  'hsl(350, 65%, 50%)',
  'hsl(45, 80%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(180, 55%, 45%)',
  'hsl(15, 70%, 50%)',
];

// Mapeamento de subtestes principais por teste
const getMainSubtests = (testCode: string): { key: string; label: string }[] => {
  switch (testCode) {
    case 'BPA2':
      return [
        { key: 'AC', label: 'Atenção Concentrada' },
        { key: 'AD', label: 'Atenção Dividida' },
        { key: 'AA', label: 'Atenção Alternada' },
        { key: 'AG', label: 'Atenção Geral' },
      ];
    case 'RAVLT':
      return [
        { key: 'escoreTotal', label: 'Escore Total' },
        { key: 'a6', label: 'Evocação Imediata' },
        { key: 'a7', label: 'Evocação Tardia' },
        { key: 'reconhecimento', label: 'Reconhecimento' },
      ];
    case 'FDT':
      return [
        { key: 'leitura', label: 'Leitura' },
        { key: 'contagem', label: 'Contagem' },
        { key: 'escolha', label: 'Escolha' },
        { key: 'alternancia', label: 'Alternância' },
        { key: 'inibicao', label: 'Inibição' },
        { key: 'flexibilidade', label: 'Flexibilidade' },
      ];
    case 'TIN':
      return [{ key: 'escorePadrao', label: 'Escore Padrão' }];
    case 'PCFO':
      return [{ key: 'escorePadrao', label: 'Escore Padrão' }];
    case 'TSBC':
      return [
        { key: 'escorePadraoTotal', label: 'EP Total' },
        { key: 'escorePadraoNomeacao', label: 'EP Nomeação' },
        { key: 'escorePadraoCompreensao', label: 'EP Compreensão' },
      ];
    case 'TRILHAS':
      return [
        { key: 'trilhaA', label: 'Trilha A' },
        { key: 'trilhaB', label: 'Trilha B' },
      ];
    case 'BDI':
      return [{ key: 'total', label: 'Escore Total' }];
    case 'BAI':
      return [{ key: 'total', label: 'Escore Total' }];
    case 'MOCA':
      return [{ key: 'total', label: 'Escore Total' }];
    case 'MEEM':
      return [{ key: 'total', label: 'Escore Total' }];
    case 'D2':
      return [
        { key: 'RL', label: 'Resultado Líquido' },
        { key: 'E%', label: '% Erros' },
      ];
    case 'RAVEN':
      return [{ key: 'total', label: 'Total' }];
    case 'WCST':
      return [
        { key: 'categorias', label: 'Categorias' },
        { key: 'errosPerseverativos', label: 'Erros Perseverativos' },
      ];
    case 'STROOP':
      return [
        { key: 'palavras', label: 'Palavras' },
        { key: 'cores', label: 'Cores' },
        { key: 'palavrasCores', label: 'Palavras-Cores' },
        { key: 'interferencia', label: 'Interferência' },
      ];
    default: {
      // Fallback genérico: retorna as chaves dos percentiles/calculated_scores
      return [];
    }
  }
};

// Retorna o valor correto para o gráfico
const getChartValue = (test: NeuroTestResult, subtestKey: string): number | null => {
  const percentiles = test.percentiles as Record<string, number>;
  const calculatedScores = test.calculated_scores as Record<string, number>;

  // Para testes EP, usar calculated_scores
  if (EP_TESTS.includes(test.test_code)) {
    const val = calculatedScores[subtestKey];
    return typeof val === 'number' ? val : null;
  }

  // Primeiro tenta percentil, depois calculated_scores
  const pVal = percentiles[subtestKey];
  if (typeof pVal === 'number') return pVal;

  const cVal = calculatedScores[subtestKey];
  if (typeof cVal === 'number') return cVal;

  return null;
};

const getTrend = (values: (number | null)[]): 'up' | 'down' | 'stable' | null => {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 2) return null;
  const diff = valid[valid.length - 1] - valid[0];
  if (Math.abs(diff) < 2) return 'stable';
  return diff > 0 ? 'up' : 'down';
};

export default function NeuroTestEvolutionChart({ tests }: NeuroTestEvolutionChartProps) {
  // Agrupar testes por test_code
  const testGroups = useMemo(() => {
    const groups: Record<string, NeuroTestResult[]> = {};
    tests.forEach(t => {
      if (!groups[t.test_code]) groups[t.test_code] = [];
      groups[t.test_code].push(t);
    });
    // Filtrar apenas testes com 2+ aplicações
    return Object.fromEntries(
      Object.entries(groups).filter(([_, arr]) => arr.length >= 2)
    );
  }, [tests]);

  const testCodeOptions = Object.keys(testGroups);
  const [selectedTest, setSelectedTest] = useState<string>(testCodeOptions[0] || '');

  if (testCodeOptions.length === 0) {
    return null; // Não exibe nada se não há testes repetidos
  }

  const selectedTests = testGroups[selectedTest] || [];
  // Ordenar cronologicamente
  const sorted = [...selectedTests].sort(
    (a, b) => new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()
  );

  const subtests = getMainSubtests(selectedTest);
  // Fallback: gerar subtestes a partir dos dados
  const effectiveSubtests = subtests.length > 0
    ? subtests
    : (() => {
        const allKeys = new Set<string>();
        sorted.forEach(t => {
          const p = t.percentiles as Record<string, number>;
          const c = t.calculated_scores as Record<string, number>;
          Object.keys(p).forEach(k => allKeys.add(k));
          if (allKeys.size === 0) Object.keys(c).forEach(k => allKeys.add(k));
        });
        return Array.from(allKeys).slice(0, 6).map(k => ({ key: k, label: k }));
      })();

  const isEPTest = EP_TESTS.includes(selectedTest);
  const yLabel = isEPTest ? 'Escore Padrão' : 'Percentil';

  // Construir dados do gráfico
  const chartData = sorted.map((t, idx) => {
    const date = new Date(t.applied_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const entry: Record<string, string | number | null> = {
      name: `${date} (${t.patient_age}a)`,
      date,
    };
    effectiveSubtests.forEach(st => {
      entry[st.key] = getChartValue(t, st.key);
    });
    return entry;
  });

  // Calcular tendências
  const trends = effectiveSubtests.map(st => {
    const values = chartData.map(d => d[st.key] as number | null);
    return { ...st, trend: getTrend(values) };
  });

  const testName = sorted[0]?.test_name || selectedTest;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução dos Testes
          </CardTitle>
          <Select value={selectedTest} onValueChange={setSelectedTest}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecione o teste" />
            </SelectTrigger>
            <SelectContent>
              {testCodeOptions.map(code => {
                const name = testGroups[code][0]?.test_name || code;
                const count = testGroups[code].length;
                return (
                  <SelectItem key={code} value={code}>
                    {name} ({count}x)
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicadores de tendência */}
        <div className="flex flex-wrap gap-2">
          {trends.map((t, i) => (
            <Badge
              key={t.key}
              variant={t.trend === 'up' ? 'default' : t.trend === 'down' ? 'destructive' : 'secondary'}
              className="gap-1"
            >
              {t.trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {t.trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {t.trend === 'stable' && <Minus className="h-3 w-3" />}
              {t.label}
            </Badge>
          ))}
        </div>

        {/* Gráfico */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                domain={isEPTest ? [60, 140] : [0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />

              {/* Linha de referência para média */}
              {isEPTest ? (
                <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Média (100)', position: 'right', style: { fontSize: 10 } }} />
              ) : (
                <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'P50', position: 'right', style: { fontSize: 10 } }} />
              )}

              {effectiveSubtests.map((st, i) => (
                <Line
                  key={st.key}
                  type="monotone"
                  dataKey={st.key}
                  name={st.label}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela resumo */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Variável</th>
                {sorted.map((t, i) => (
                  <th key={t.id} className="text-center py-1.5 px-2 text-muted-foreground font-medium">
                    {new Date(t.applied_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </th>
                ))}
                <th className="text-center py-1.5 px-2 text-muted-foreground font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              {effectiveSubtests.map(st => {
                const values = sorted.map(t => getChartValue(t, st.key));
                const first = values.find((v): v is number => v !== null);
                const last = [...values].reverse().find((v): v is number => v !== null);
                const delta = first !== undefined && last !== undefined ? last - first : null;

                return (
                  <tr key={st.key} className="border-b border-muted/50">
                    <td className="py-1.5 px-2 font-medium">{st.label}</td>
                    {values.map((v, i) => (
                      <td key={i} className="text-center py-1.5 px-2 font-mono">
                        {v !== null ? (Number.isInteger(v) ? v : v.toFixed(1)) : '-'}
                      </td>
                    ))}
                    <td className="text-center py-1.5 px-2 font-mono font-bold">
                      {delta !== null ? (
                        <span className={delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-muted-foreground'}>
                          {delta > 0 ? '+' : ''}{Number.isInteger(delta) ? delta : delta.toFixed(1)}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
