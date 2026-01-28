import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Brain, Calendar, ClipboardCopy, Eye, FileText, Loader2, User } from 'lucide-react';
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

export default function PatientNeuroTestHistory({
  clientId,
  clientName
}: PatientNeuroTestHistoryProps) {
  const { toast } = useToast();
  const [tests, setTests] = useState<NeuroTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<NeuroTestResult | null>(null);
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
    const calculatedScores = test.calculated_scores as Record<string, number>;
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
      'Subteste           | Escore | Percentil | Classificação',
      '-------------------------------------------'
    ];

    const subtests = [
      { code: 'AC', name: 'Atenção Concentrada' },
      { code: 'AD', name: 'Atenção Dividida' },
      { code: 'AA', name: 'Atenção Alternada' },
      { code: 'AG', name: 'Atenção Geral' }
    ];

    subtests.forEach(({ code, name }) => {
      const score = calculatedScores[code] ?? 0;
      const percentile = percentiles[code] ?? 0;
      const classification = classifications[code] ?? '-';
      lines.push(
        `${name.padEnd(18)} | ${String(score).padStart(6)} | ${String(percentile).padStart(9)} | ${classification}`
      );
    });

    lines.push('-------------------------------------------');

    if (test.notes) {
      lines.push('', 'OBSERVAÇÕES:', test.notes);
    }

    navigator.clipboard.writeText(lines.filter(l => l !== undefined).join('\n'));
    toast({
      title: "Copiado!",
      description: "Resultado do teste copiado para a área de transferência."
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
    <>
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
            {tests.map((test, index) => {
              const calculatedScores = test.calculated_scores as Record<string, number>;
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
                      <Badge variant={getClassificationVariant(classifications['AG'] || 'Médio')}>
                        AG: {calculatedScores['AG'] ?? '-'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Tabela de resultados */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subteste</TableHead>
                            <TableHead className="text-center">Escore</TableHead>
                            <TableHead className="text-center">Percentil</TableHead>
                            <TableHead className="text-right">Classificação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {['AC', 'AD', 'AA', 'AG'].map(code => {
                            const percentiles = test.percentiles as Record<string, number>;
                            const score = calculatedScores[code] ?? 0;
                            const percentile = percentiles[code] ?? 0;
                            const classification = classifications[code] ?? '-';
                            
                            const names: Record<string, string> = {
                              'AC': 'Atenção Concentrada',
                              'AD': 'Atenção Dividida',
                              'AA': 'Atenção Alternada',
                              'AG': 'Atenção Geral'
                            };

                            return (
                              <TableRow key={code} className={code === 'AG' ? 'bg-primary/5 font-medium' : ''}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {code === 'AG' && <Brain className="h-4 w-4 text-primary" />}
                                    <span>{names[code]}</span>
                                    <Badge variant="outline" className="text-xs">{code}</Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-mono">{score}</TableCell>
                                <TableCell className="text-center font-mono">{percentile}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={getClassificationVariant(classification)}>
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
    </>
  );
}

function getClassificationVariant(classification: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (classification.includes('Inferior')) return 'destructive';
  if (classification.includes('Superior')) return 'default';
  return 'secondary';
}
