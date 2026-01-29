import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Brain, Calendar, ClipboardCopy, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface NeuroTestResult {
  id: string;
  client_id: string;
  schedule_id: string | null;
  test_code: string;
  test_name: string;
  patient_age: number;
  raw_scores: Json;
  calculated_scores: Json;
  percentiles: Json;
  classifications: Json;
  applied_by: string | null;
  applied_at: string;
  notes: string | null;
  created_at: string;
}

interface PatientNeuroTestHistoryProps {
  clientId: string;
  clientName: string;
}

interface TestConfig {
  subtests: string[];
  names: Record<string, string>;
  mainSubtest: string;
  useRawScores?: string[]; // Subtests que usam raw_scores ao invés de calculated_scores
}

// Configuração de subtestes por tipo de teste
const getTestConfig = (testCode: string): TestConfig | null => {
  switch (testCode) {
    case 'BPA2':
      return {
        subtests: ['AC', 'AD', 'AA', 'AG'],
        names: {
          AC: 'Atenção Concentrada',
          AD: 'Atenção Dividida',
          AA: 'Atenção Alternada',
          AG: 'Atenção Geral'
        },
        mainSubtest: 'AG'
      };
    case 'RAVLT':
      return {
        subtests: ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'a6', 'a7', 'escoreTotal', 'reconhecimento'],
        names: {
          a1: 'A1 (1ª tentativa)',
          a2: 'A2 (2ª tentativa)',
          a3: 'A3 (3ª tentativa)',
          a4: 'A4 (4ª tentativa)',
          a5: 'A5 (5ª tentativa)',
          b1: 'B1 (Lista B)',
          a6: 'A6 (Evocação imediata)',
          a7: 'A7 (Evocação tardia)',
          escoreTotal: 'Escore Total (A1-A5)',
          reconhecimento: 'Reconhecimento'
        },
        mainSubtest: 'escoreTotal',
        useRawScores: ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'a6', 'a7']
      };
    case 'FDT':
      return {
        subtests: ['inibicao', 'flexibilidade'],
        names: {
          inibicao: 'Inibição',
          flexibilidade: 'Flexibilidade'
        },
        mainSubtest: 'inibicao'
      };
    default:
      return null;
  }
};

// Obtém o escore correto (raw ou calculated) para cada subteste
const getScoreValue = (
  test: NeuroTestResult,
  subtestCode: string,
  config: TestConfig
): number | string => {
  const rawScores = test.raw_scores as Record<string, number>;
  const calculatedScores = test.calculated_scores as Record<string, number>;
  
  // Se é um subteste que usa raw_scores
  if (config.useRawScores?.includes(subtestCode)) {
    return rawScores[subtestCode] ?? '-';
  }
  
  // Caso contrário, usa calculated_scores
  return calculatedScores[subtestCode] ?? '-';
};

export default function PatientNeuroTestHistory({
  clientId,
  clientName
}: PatientNeuroTestHistoryProps) {
  const { toast } = useToast();
  const [tests, setTests] = useState<NeuroTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [applierNames, setApplierNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTests();
  }, [clientId]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('neuro_test_results')
        .select('*')
        .eq('client_id', clientId)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      setTests(data || []);

      // Buscar nomes dos aplicadores
      const applierIds = [...new Set((data || []).map(t => t.applied_by).filter(Boolean))];
      if (applierIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', applierIds);

        const names: Record<string, string> = {};
        profiles?.forEach(p => {
          names[p.user_id] = p.name || 'Desconhecido';
        });
        setApplierNames(names);
      }
    } catch (error) {
      console.error('Erro ao buscar testes:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (test: NeuroTestResult) => {
    const config = getTestConfig(test.test_code);
    if (!config) {
      toast({
        title: "Erro",
        description: "Tipo de teste não reconhecido.",
        variant: "destructive"
      });
      return;
    }

    const percentiles = test.percentiles as Record<string, number>;
    const classifications = test.classifications as Record<string, string>;

    const lines = [
      `TESTE: ${test.test_name}`,
      `Paciente: ${clientName} (${test.patient_age} anos)`,
      `Data: ${new Date(test.applied_at).toLocaleDateString('pt-BR')}`,
      test.applied_by ? `Aplicador: ${applierNames[test.applied_by] || 'Desconhecido'}` : '',
      '',
      'RESULTADOS:',
      '-------------------------------------------',
      'Variável                | Bruto | Percentil | Classificação',
      '-------------------------------------------'
    ];

    config.subtests.forEach(code => {
      const name = config.names[code] || code;
      const score = getScoreValue(test, code, config);
      const percentile = percentiles[code] ?? '-';
      const classification = classifications[code] ?? '-';
      
      lines.push(
        `${name.padEnd(23)} | ${String(score).padStart(5)} | ${String(percentile).padStart(9)} | ${classification}`
      );
    });

    lines.push('-------------------------------------------');

    if (test.notes) {
      lines.push('', 'OBSERVAÇÕES:', test.notes);
    }

    navigator.clipboard.writeText(lines.filter(l => l !== undefined && l !== '').join('\n'));
    toast({
      title: "Copiado!",
      description: "Resultado do teste copiado para a área de transferência."
    });
  };

  // Obtém o badge de resumo para o accordion
  const getMainSubtestBadge = (test: NeuroTestResult) => {
    const config = getTestConfig(test.test_code);
    if (!config) return null;

    const calculatedScores = test.calculated_scores as Record<string, number>;
    const classifications = test.classifications as Record<string, string>;
    const mainCode = config.mainSubtest;
    const mainScore = calculatedScores[mainCode] ?? '-';
    const mainClassification = classifications[mainCode] || 'Médio';

    // Abreviação do subteste principal
    const shortName = test.test_code === 'RAVLT' ? 'Total' : 
                      test.test_code === 'FDT' ? 'Inib.' : 
                      mainCode;

    return (
      <Badge variant={getClassificationVariant(mainClassification)}>
        {shortName}: {mainScore}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Brain className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Nenhum teste neuropsicológico registrado para este paciente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Histórico de Testes Neuropsicológicos
          <Badge variant="secondary" className="ml-auto">{tests.length} teste(s)</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {tests.map((test) => {
            const config = getTestConfig(test.test_code);
            if (!config) return null;

            const percentiles = test.percentiles as Record<string, number>;
            const classifications = test.classifications as Record<string, string>;
            
            return (
              <AccordionItem key={test.id} value={test.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex flex-col">
                      <span className="font-medium">{test.test_name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(test.applied_at).toLocaleDateString('pt-BR')}
                        <span>•</span>
                        {test.patient_age} anos
                      </span>
                    </div>
                    {getMainSubtestBadge(test)}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Tabela de resultados dinâmica */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variável</TableHead>
                          <TableHead className="text-center">Bruto</TableHead>
                          <TableHead className="text-center">Percentil</TableHead>
                          <TableHead className="text-right">Classificação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {config.subtests.map(code => {
                          const score = getScoreValue(test, code, config);
                          const percentile = percentiles[code] ?? '-';
                          const classification = classifications[code] ?? '-';
                          const isMain = code === config.mainSubtest;

                          return (
                            <TableRow key={code} className={isMain ? 'bg-primary/5 font-medium' : ''}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {isMain && <Brain className="h-4 w-4 text-primary" />}
                                  <span>{config.names[code] || code}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono">{score}</TableCell>
                              <TableCell className="text-center font-mono">{percentile}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={getClassificationVariant(String(classification))}>
                                  {classification}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {/* Aplicador e observações */}
                    <div className="flex flex-col gap-2 text-sm">
                      {test.applied_by && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Aplicado por: {applierNames[test.applied_by] || 'Desconhecido'}</span>
                        </div>
                      )}
                      {test.notes && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium mb-1">Observações:</p>
                          <p className="text-muted-foreground">{test.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Botão copiar */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(test)}
                      className="w-full"
                    >
                      <ClipboardCopy className="h-4 w-4 mr-2" />
                      Copiar para Laudo
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function getClassificationVariant(classification: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (classification.includes('Inferior')) return 'destructive';
  if (classification.includes('Superior')) return 'default';
  return 'secondary';
}
